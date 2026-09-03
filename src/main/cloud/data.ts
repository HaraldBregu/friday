import type {
	CloudChange,
	CloudChatMessage,
	CloudChatMessageInput,
	CloudChatSession,
	CloudChatSessionInput,
	CloudFile,
	CloudFileUpload,
} from '../../shared/cloud_types';
import type { AuthService } from './service';
import type { CloudRepository } from './repository';

export class CloudService {
	private readonly listeners = new Set<(change: CloudChange) => void>();
	private unsubscribeSession?: () => void;

	constructor(
		private readonly auth: AuthService,
		private readonly repository?: CloudRepository
	) {}

	initialize(): void {
		if (this.unsubscribeSession) return;
		this.unsubscribeSession = this.auth.onSessionChanged((session) => {
			void this.repository?.setAccessToken(session?.accessToken ?? null).catch(() => undefined);
			if (!session) void this.repository?.clearWatches().catch(() => undefined);
		});
		const token = this.auth.getAccessToken();
		if (token) void this.repository?.setAccessToken(token).catch(() => undefined);
	}

	onSessionChanged(listener: (change: CloudChange) => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	listSessions(): Promise<CloudChatSession[]> {
		this.requireUserId();
		return this.remote().listSessions();
	}

	upsertSession(input: CloudChatSessionInput): Promise<CloudChatSession> {
		return this.remote().upsertSession(this.requireUserId(), input);
	}

	async deleteSession(sessionId: string): Promise<void> {
		this.requireUserId();
		await this.remote().deleteSession(sessionId);
		await this.remote().unwatchSession(sessionId);
	}

	listMessages(sessionId: string): Promise<CloudChatMessage[]> {
		this.requireUserId();
		return this.remote().listMessages(sessionId);
	}

	upsertMessage(input: CloudChatMessageInput): Promise<CloudChatMessage> {
		return this.remote().upsertMessage(this.requireUserId(), input);
	}

	uploadFile(input: CloudFileUpload): Promise<CloudFile> {
		return this.remote().uploadFile(this.requireUserId(), input);
	}

	downloadFile(fileId: string): Promise<ArrayBuffer> {
		this.requireUserId();
		return this.remote().downloadFile(fileId);
	}

	async deleteFile(fileId: string): Promise<void> {
		this.requireUserId();
		await this.remote().deleteFile(fileId);
	}

	async watchSession(sessionId: string): Promise<void> {
		this.requireUserId();
		await this.remote().watchSession(sessionId, (event) => {
			this.listeners.forEach((listener) => listener({ sessionId, event }));
		});
	}

	async unwatchSession(sessionId: string): Promise<void> {
		await this.remote().unwatchSession(sessionId);
	}

	async destroy(): Promise<void> {
		this.unsubscribeSession?.();
		this.unsubscribeSession = undefined;
		await this.repository?.clearWatches();
		this.listeners.clear();
	}

	private remote(): CloudRepository {
		if (!this.repository) throw new Error('Cloud synchronization is unavailable in this build.');
		return this.repository;
	}

	private requireUserId(): string {
		const userId = this.auth.getSignedInUserId();
		if (!userId) throw new Error('Sign in to use cloud synchronization.');
		return userId;
	}
}
