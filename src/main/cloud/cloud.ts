import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
	CloudChange,
	CloudChatMessage,
	CloudChatMessageInput,
	CloudChatSession,
	CloudChatSessionInput,
	CloudFile,
	CloudFileUpload,
	CloudJson,
} from '../../shared/cloud_types';
import type { AuthService } from './auth';
import { publicCloudError } from './cloud_error';

interface SessionRow {
	id: string;
	title: string;
	model: string | null;
	created_at: string;
	updated_at: string;
}

interface MessageRow {
	id: string;
	session_id: string;
	ordinal: number;
	role: 'system' | 'user' | 'assistant';
	content: CloudJson;
	tool_calls: CloudJson[];
	usage: CloudJson | null;
	created_at: string;
}

interface FileRow {
	id: string;
	session_id: string;
	object_path: string;
	file_name: string;
	mime_type: string;
	size_bytes: number;
	created_at: string;
}

export class CloudService {
	private readonly channels = new Map<string, RealtimeChannel>();
	private readonly listeners = new Set<(change: CloudChange) => void>();
	private unsubscribeSession?: () => void;

	constructor(private readonly auth: AuthService) {}

	initialize(): void {
		if (this.unsubscribeSession) return;
		this.unsubscribeSession = this.auth.onSessionChanged((session) => {
			if (!session) {
				void this.clearChannels();
				return;
			}
			void this.auth.getClient().realtime.setAuth(session.access_token);
		});
		const token = this.auth.getAccessToken();
		if (token) void this.auth.getClient().realtime.setAuth(token);
	}

	onSessionChanged(listener: (change: CloudChange) => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	async listSessions(): Promise<CloudChatSession[]> {
		this.requireUserId();
		const { data, error } = await this.auth
			.getClient()
			.from('chat_sessions')
			.select('id,title,model,created_at,updated_at')
			.order('updated_at', { ascending: false });
		if (error) throw publicCloudError(error);
		return (data as SessionRow[]).map((row) => this.session(row));
	}

	async upsertSession(input: CloudChatSessionInput): Promise<CloudChatSession> {
		const ownerId = this.requireUserId();
		const { data, error } = await this.auth
			.getClient()
			.from('chat_sessions')
			.upsert(
				{
					id: input.id,
					owner_id: ownerId,
					title: input.title,
					model: input.model ?? null,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: 'id' }
			)
			.select('id,title,model,created_at,updated_at')
			.single();
		if (error) throw publicCloudError(error);
		return this.session(data as SessionRow);
	}

	async deleteSession(sessionId: string): Promise<void> {
		this.requireUserId();
		const client = this.auth.getClient();
		const { data: files, error: filesError } = await client
			.from('files')
			.select('object_path')
			.eq('session_id', sessionId);
		if (filesError) throw publicCloudError(filesError);
		const paths = (files as { object_path: string }[]).map((file) => file.object_path);
		if (paths.length > 0) {
			const { error: storageError } = await client.storage.from('user-files').remove(paths);
			if (storageError) throw publicCloudError(storageError);
		}
		const { error } = await client.from('chat_sessions').delete().eq('id', sessionId);
		if (error) throw publicCloudError(error);
		await this.unwatchSession(sessionId);
	}

	async listMessages(sessionId: string): Promise<CloudChatMessage[]> {
		this.requireUserId();
		const { data, error } = await this.auth
			.getClient()
			.from('chat_messages')
			.select('id,session_id,ordinal,role,content,tool_calls,usage,created_at')
			.eq('session_id', sessionId)
			.order('ordinal', { ascending: true });
		if (error) throw publicCloudError(error);
		return (data as MessageRow[]).map((row) => this.message(row));
	}

	async upsertMessage(input: CloudChatMessageInput): Promise<CloudChatMessage> {
		const ownerId = this.requireUserId();
		const { data, error } = await this.auth
			.getClient()
			.from('chat_messages')
			.upsert(
				{
					id: input.id,
					session_id: input.sessionId,
					owner_id: ownerId,
					ordinal: input.ordinal,
					role: input.role,
					content: input.content,
					tool_calls: input.toolCalls ?? [],
					usage: input.usage ?? null,
				},
				{ onConflict: 'id' }
			)
			.select('id,session_id,ordinal,role,content,tool_calls,usage,created_at')
			.single();
		if (error) throw publicCloudError(error);
		return this.message(data as MessageRow);
	}

	async uploadFile(input: CloudFileUpload): Promise<CloudFile> {
		const ownerId = this.requireUserId();
		const client = this.auth.getClient();
		const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 160) || 'file';
		const objectPath = `${ownerId}/sessions/${input.sessionId}/${input.id}/${safeName}`;
		const { error: storageError } = await client.storage
			.from('user-files')
			.upload(objectPath, input.data, { contentType: input.mimeType, upsert: false });
		if (storageError) throw publicCloudError(storageError);
		const { data, error } = await client
			.from('files')
			.insert({
				id: input.id,
				session_id: input.sessionId,
				owner_id: ownerId,
				object_path: objectPath,
				file_name: input.fileName,
				mime_type: input.mimeType,
				size_bytes: input.data.byteLength,
			})
			.select('id,session_id,object_path,file_name,mime_type,size_bytes,created_at')
			.single();
		if (error) {
			await client.storage.from('user-files').remove([objectPath]);
			throw publicCloudError(error);
		}
		return this.file(data as FileRow);
	}

	async downloadFile(fileId: string): Promise<ArrayBuffer> {
		this.requireUserId();
		const client = this.auth.getClient();
		const { data: record, error: recordError } = await client
			.from('files')
			.select('object_path')
			.eq('id', fileId)
			.single();
		if (recordError) throw publicCloudError(recordError);
		const { data, error } = await client.storage
			.from('user-files')
			.download((record as { object_path: string }).object_path);
		if (error) throw publicCloudError(error);
		return data.arrayBuffer();
	}

	async deleteFile(fileId: string): Promise<void> {
		this.requireUserId();
		const client = this.auth.getClient();
		const { data: record, error: recordError } = await client
			.from('files')
			.select('object_path')
			.eq('id', fileId)
			.single();
		if (recordError) throw publicCloudError(recordError);
		const { error: storageError } = await client.storage
			.from('user-files')
			.remove([(record as { object_path: string }).object_path]);
		if (storageError) throw publicCloudError(storageError);
		const { error } = await client.from('files').delete().eq('id', fileId);
		if (error) throw publicCloudError(error);
	}

	async watchSession(sessionId: string): Promise<void> {
		this.requireUserId();
		if (this.channels.has(sessionId)) return;
		const client = this.auth.getClient();
		const { data, error } = await client
			.from('chat_sessions')
			.select('id')
			.eq('id', sessionId)
			.single();
		if (error || !data) throw publicCloudError(error);
		const channel = client
			.channel(`chat:${sessionId}`, { config: { private: true } })
			.on('broadcast', { event: '*' }, (payload) => {
				const event = payload.event;
				if (event !== 'INSERT' && event !== 'UPDATE' && event !== 'DELETE') return;
				this.listeners.forEach((listener) => listener({ sessionId, event }));
			});
		this.channels.set(sessionId, channel);
		channel.subscribe();
	}

	async unwatchSession(sessionId: string): Promise<void> {
		const channel = this.channels.get(sessionId);
		if (!channel) return;
		this.channels.delete(sessionId);
		await this.auth.getClient().removeChannel(channel);
	}

	async destroy(): Promise<void> {
		this.unsubscribeSession?.();
		this.unsubscribeSession = undefined;
		await this.clearChannels();
		this.listeners.clear();
	}

	private async clearChannels(): Promise<void> {
		if (this.channels.size === 0) return;
		this.channels.clear();
		if (this.auth.getState().status !== 'unconfigured') {
			await this.auth.getClient().removeAllChannels();
		}
	}

	private requireUserId(): string {
		const state = this.auth.getState();
		if ((state.status !== 'signedIn' && state.status !== 'recovery') || !state.user) {
			throw new Error('Sign in to use sync.');
		}
		return state.user.id;
	}

	private session(row: SessionRow): CloudChatSession {
		return {
			id: row.id,
			title: row.title,
			...(row.model ? { model: row.model } : {}),
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		};
	}

	private message(row: MessageRow): CloudChatMessage {
		return {
			id: row.id,
			sessionId: row.session_id,
			ordinal: row.ordinal,
			role: row.role,
			content: row.content,
			toolCalls: row.tool_calls,
			...(row.usage === null ? {} : { usage: row.usage }),
			createdAt: row.created_at,
		};
	}

	private file(row: FileRow): CloudFile {
		return {
			id: row.id,
			sessionId: row.session_id,
			objectPath: row.object_path,
			fileName: row.file_name,
			mimeType: row.mime_type,
			sizeBytes: row.size_bytes,
			createdAt: row.created_at,
		};
	}
}
