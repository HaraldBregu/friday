import { createClient, type AuthChangeEvent, type Session, type SupabaseClient } from '@supabase/supabase-js';
import type { AuthCredentials, AuthState, SignUpInput } from '../../shared/auth_types';
import type { CloudConfig } from './config';
import { publicAuthError } from './error';
import { EncryptedSessionStorage } from './session';
import { DeviceAccountBinding } from './binding';

type Subscription = { unsubscribe: () => void };

export class AuthService {
	private client?: SupabaseClient;
	private storage?: EncryptedSessionStorage;
	private binding?: DeviceAccountBinding;
	private subscription?: Subscription;
	private session: Session | null = null;
	private initialized = false;
	private stateListeners = new Set<(state: AuthState) => void>();
	private sessionListeners = new Set<(session: Session | null) => void>();
	private state: AuthState = { status: 'loading', persistence: 'memory' };

	constructor(private readonly config: CloudConfig | null) {}

	async initialize(): Promise<void> {
		if (this.initialized) return;
		this.initialized = true;
		if (!this.config) {
			this.setState({ status: 'unconfigured', persistence: 'memory' });
			return;
		}
		this.storage = new EncryptedSessionStorage();
		this.binding = new DeviceAccountBinding();
		this.client = createClient(this.config.url, this.config.publishableKey, {
			auth: {
				storage: this.storage,
				autoRefreshToken: true,
				persistSession: true,
				detectSessionInUrl: false,
				flowType: 'pkce',
			},
		});
		this.subscription = this.client.auth.onAuthStateChange((event, session) => {
			this.applySession(event, session);
		}).data.subscription;
		const { data, error } = await this.client.auth.getSession();
		if (error) {
			this.storage.clear();
			this.applySession('SIGNED_OUT', null);
			return;
		}
		this.applySession('INITIAL_SESSION', data.session);
	}

	getState(): AuthState {
		return structuredClone(this.state);
	}

	getClient(): SupabaseClient {
		if (!this.client) throw new Error('Supabase is not configured.');
		return this.client;
	}

	getAccessToken(): string | null {
		return this.session?.access_token ?? null;
	}

	onStateChanged(listener: (state: AuthState) => void): () => void {
		this.stateListeners.add(listener);
		return () => this.stateListeners.delete(listener);
	}

	onSessionChanged(listener: (session: Session | null) => void): () => void {
		this.sessionListeners.add(listener);
		return () => this.sessionListeners.delete(listener);
	}

	async signIn(credentials: AuthCredentials): Promise<AuthState> {
		const { data, error } = await this.getClient().auth.signInWithPassword(credentials);
		if (error) throw publicAuthError(error);
		this.applySession('SIGNED_IN', data.session);
		if (this.state.status !== 'signedIn') throw this.accountMismatchError();
		return this.getState();
	}

	async signUp(input: SignUpInput): Promise<AuthState> {
		if (!this.config) throw new Error('Supabase is not configured.');
		const { email, password, displayName } = input;
		const { data, error } = await this.getClient().auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: this.config.redirectUrl,
				data: displayName ? { display_name: displayName } : undefined,
			},
		});
		if (error) throw publicAuthError(error);
		if (data.session) {
			this.applySession('SIGNED_IN', data.session);
			if (this.state.status !== 'signedIn') throw this.accountMismatchError();
		}
		else {
			this.setState({
				status: 'confirmationRequired',
				email,
				persistence: this.persistence(),
			});
		}
		return this.getState();
	}

	async resendConfirmation(email: string): Promise<void> {
		if (!this.config) throw new Error('Supabase is not configured.');
		const { error } = await this.getClient().auth.resend({
			type: 'signup',
			email,
			options: { emailRedirectTo: this.config.redirectUrl },
		});
		if (error) throw publicAuthError(error);
	}

	async requestPasswordReset(email: string): Promise<void> {
		if (!this.config) throw new Error('Supabase is not configured.');
		const { error } = await this.getClient().auth.resetPasswordForEmail(email, {
			redirectTo: this.config.redirectUrl,
		});
		if (error) throw publicAuthError(error);
	}

	async updatePassword(password: string): Promise<AuthState> {
		const { data, error } = await this.getClient().auth.updateUser({ password });
		if (error) throw publicAuthError(error);
		if (!this.session) throw new Error('The recovery session has expired.');
		this.applySession('USER_UPDATED', { ...this.session, user: data.user });
		return this.getState();
	}

	async signOut(): Promise<AuthState> {
		if (this.client) {
			const { error } = await this.client.auth.signOut({ scope: 'local' });
			if (error) throw publicAuthError(error);
		}
		this.storage?.clear();
		this.applySession('SIGNED_OUT', null);
		return this.getState();
	}

	async handleDeepLink(value: string): Promise<AuthState> {
		const url = new URL(value);
		if (url.protocol !== 'friday:' || url.hostname !== 'auth' || url.pathname !== '/callback') {
			throw new Error('The authentication link is invalid.');
		}
		if (url.searchParams.has('error')) throw new Error('The authentication link was rejected.');
		const code = url.searchParams.get('code');
		if (!code || code.length > 2048) throw new Error('The authentication link has expired.');
		const recovery = url.searchParams.get('type') === 'recovery';
		const { data, error } = await this.getClient().auth.exchangeCodeForSession(code);
		if (error) throw publicAuthError(error);
		this.applySession(recovery ? 'PASSWORD_RECOVERY' : 'SIGNED_IN', data.session);
		if (this.state.status !== (recovery ? 'recovery' : 'signedIn')) {
			throw this.accountMismatchError();
		}
		return this.getState();
	}

	destroy(): void {
		this.subscription?.unsubscribe();
		this.client?.auth.stopAutoRefresh();
		this.stateListeners.clear();
		this.sessionListeners.clear();
	}

	private applySession(event: AuthChangeEvent, session: Session | null): void {
		if (session && !this.binding?.accept(session.user.id)) {
			this.session = null;
			this.storage?.clear();
			this.setState({ status: 'signedOut', persistence: this.persistence() });
			queueMicrotask(() => void this.client?.auth.signOut({ scope: 'local' }));
			return;
		}
		this.session = session;
		this.sessionListeners.forEach((listener) => listener(session));
		if (!session) {
			this.setState({ status: 'signedOut', persistence: this.persistence() });
			return;
		}
		const displayName = session.user.user_metadata.display_name;
		const avatarPath = session.user.user_metadata.avatar_path;
		this.setState({
			status: event === 'PASSWORD_RECOVERY' ? 'recovery' : 'signedIn',
			persistence: this.persistence(),
			user: {
				id: session.user.id,
				email: session.user.email ?? '',
				...(typeof displayName === 'string' ? { displayName } : {}),
				...(typeof avatarPath === 'string' ? { avatarPath } : {}),
			},
		});
	}

	private persistence(): 'encrypted' | 'memory' {
		return this.storage?.persistent ? 'encrypted' : 'memory';
	}

	private setState(state: AuthState): void {
		this.state = state;
		this.stateListeners.forEach((listener) => listener(this.getState()));
	}

	private accountMismatchError(): Error {
		const error = new Error(
			'This local Friday profile belongs to another account. Use that account or a separate operating-system profile.'
		);
		error.name = 'AccountMismatchError';
		return error;
	}
}
