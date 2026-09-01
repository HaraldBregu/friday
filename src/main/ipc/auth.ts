import { shell } from 'electron';
import type { AuthCredentials, SignUpInput } from '../../shared/auth_types';
import { AuthChannels } from '../../shared/ipc_channels_definitions';
import type { AuthService } from '../cloud/auth';
import type { ExtensionRegistry } from '../extensions/extension_registry';
import type { EventBus } from '../event_bus';
import type { WindowContextManager } from '../window_context';
import { registerCommandWithEvent, registerQueryWithEvent } from './core/gateway';
import type { IpcModule } from './core/module';
import { TrustedRenderer } from './core/trusted';

export interface AuthIpcDeps {
	auth: AuthService;
	windows: WindowContextManager;
	extensions: ExtensionRegistry;
}

export class AuthIpc implements IpcModule<AuthIpcDeps> {
	readonly name = 'auth';

	register({ auth, windows, extensions }: AuthIpcDeps, _eventBus: EventBus): void {
		const trusted = new TrustedRenderer(windows, extensions);
		auth.onStateChanged((state) => trusted.broadcast(AuthChannels.stateChanged, state));
		registerQueryWithEvent(AuthChannels.getState, (event) => {
			trusted.assert(event);
			return auth.getState();
		});
		registerCommandWithEvent(AuthChannels.signIn, (event, value) => {
			trusted.assert(event);
			return auth.signIn(this.credentials(value));
		});
		registerCommandWithEvent(AuthChannels.signInWithGoogle, async (event) => {
			trusted.assert(event);
			await shell.openExternal(await auth.signInWithGoogle());
		});
		registerCommandWithEvent(AuthChannels.signUp, (event, value) => {
			trusted.assert(event);
			return auth.signUp(this.signUp(value));
		});
		registerCommandWithEvent(AuthChannels.resendConfirmation, (event, value) => {
			trusted.assert(event);
			return auth.resendConfirmation(this.email(value));
		});
		registerCommandWithEvent(AuthChannels.requestPasswordReset, (event, value) => {
			trusted.assert(event);
			return auth.requestPasswordReset(this.email(value));
		});
		registerCommandWithEvent(AuthChannels.updatePassword, (event, value) => {
			trusted.assert(event);
			return auth.updatePassword(this.password(value));
		});
		registerCommandWithEvent(AuthChannels.signOut, (event) => {
			trusted.assert(event);
			return auth.signOut();
		});
	}

	private credentials(value: unknown): AuthCredentials {
		const record = this.record(value);
		return { email: this.email(record.email), password: this.password(record.password) };
	}

	private signUp(value: unknown): SignUpInput {
		const record = this.record(value);
		const credentials = this.credentials(record);
		if (record.displayName === undefined) return credentials;
		if (typeof record.displayName !== 'string' || record.displayName.trim().length > 80) {
			throw new Error('Display name is invalid.');
		}
		return { ...credentials, displayName: record.displayName.trim() || undefined };
	}

	private record(value: unknown): Record<string, unknown> {
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			throw new Error('Authentication input is invalid.');
		}
		return value as Record<string, unknown>;
	}

	private email(value: unknown): string {
		if (
			typeof value !== 'string' ||
			value.length > 254 ||
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
		) {
			throw new Error('Enter a valid email address.');
		}
		return value.trim().toLowerCase();
	}

	private password(value: unknown): string {
		if (typeof value !== 'string' || value.length < 8 || value.length > 1024) {
			throw new Error('Password must contain at least eight characters.');
		}
		return value;
	}
}
