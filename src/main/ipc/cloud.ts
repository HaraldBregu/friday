import type {
	CloudChatMessageInput,
	CloudChatSessionInput,
	CloudFileUpload,
} from '../../shared/cloud_types';
import { CloudChannels } from '../../shared/ipc_channels_definitions';
import type { CloudService } from '../cloud/data';
import type { AppRegistry } from '../apps/app_registry';
import type { EventBus } from '../event_bus';
import type { WindowContextManager } from '../window_context';
import { registerCommandWithEvent, registerQueryWithEvent } from './core/gateway';
import type { IpcModule } from './core/module';
import { TrustedRenderer } from './core/trusted';

export interface CloudIpcDeps {
	cloud: CloudService;
	windows: WindowContextManager;
	apps: AppRegistry;
}

export class CloudIpc implements IpcModule<CloudIpcDeps> {
	readonly name = 'cloud';

	register({ cloud, windows, apps }: CloudIpcDeps, _eventBus: EventBus): void {
		const trusted = new TrustedRenderer(windows, apps);
		cloud.onSessionChanged((change) => trusted.broadcast(CloudChannels.sessionChanged, change));
		registerQueryWithEvent(CloudChannels.listSessions, (event) => {
			trusted.assert(event);
			return cloud.listSessions();
		});
		registerCommandWithEvent(CloudChannels.upsertSession, (event, value) => {
			trusted.assert(event);
			return cloud.upsertSession(this.session(value));
		});
		registerCommandWithEvent(CloudChannels.deleteSession, (event, value) => {
			trusted.assert(event);
			return cloud.deleteSession(this.uuid(value));
		});
		registerQueryWithEvent(CloudChannels.listMessages, (event, value) => {
			trusted.assert(event);
			return cloud.listMessages(this.uuid(value));
		});
		registerCommandWithEvent(CloudChannels.upsertMessage, (event, value) => {
			trusted.assert(event);
			return cloud.upsertMessage(this.message(value));
		});
		registerCommandWithEvent(CloudChannels.uploadFile, (event, value) => {
			trusted.assert(event);
			return cloud.uploadFile(this.file(value));
		});
		registerQueryWithEvent(CloudChannels.downloadFile, (event, value) => {
			trusted.assert(event);
			return cloud.downloadFile(this.uuid(value));
		});
		registerCommandWithEvent(CloudChannels.deleteFile, (event, value) => {
			trusted.assert(event);
			return cloud.deleteFile(this.uuid(value));
		});
		registerCommandWithEvent(CloudChannels.watchSession, (event, value) => {
			trusted.assert(event);
			return cloud.watchSession(this.uuid(value));
		});
		registerCommandWithEvent(CloudChannels.unwatchSession, (event, value) => {
			trusted.assert(event);
			return cloud.unwatchSession(this.uuid(value));
		});
	}

	private session(value: unknown): CloudChatSessionInput {
		const record = this.record(value);
		const title = this.text(record.title, 200, 'Conversation title');
		const model =
			record.model === undefined ? undefined : this.text(record.model, 200, 'Model identifier');
		return { id: this.uuid(record.id), title, ...(model ? { model } : {}) };
	}

	private message(value: unknown): CloudChatMessageInput {
		const record = this.record(value);
		if (record.role !== 'system' && record.role !== 'user' && record.role !== 'assistant') {
			throw new Error('Message role is invalid.');
		}
		if (!Number.isSafeInteger(record.ordinal) || (record.ordinal as number) < 0) {
			throw new Error('Message order is invalid.');
		}
		const size = JSON.stringify({
			content: record.content,
			toolCalls: record.toolCalls,
			usage: record.usage,
		}).length;
		if (size > 10_000_000) throw new Error('Message is too large to synchronize.');
		return {
			id: this.uuid(record.id),
			sessionId: this.uuid(record.sessionId),
			ordinal: record.ordinal as number,
			role: record.role,
			content: record.content as CloudChatMessageInput['content'],
			...(Array.isArray(record.toolCalls)
				? { toolCalls: record.toolCalls as CloudChatMessageInput['toolCalls'] }
				: {}),
			...(record.usage === undefined
				? {}
				: { usage: record.usage as CloudChatMessageInput['usage'] }),
		};
	}

	private file(value: unknown): CloudFileUpload {
		const record = this.record(value);
		if (!(record.data instanceof ArrayBuffer) || record.data.byteLength > 50 * 1024 * 1024) {
			throw new Error('Cloud files must be no larger than 50 MiB.');
		}
		return {
			id: this.uuid(record.id),
			sessionId: this.uuid(record.sessionId),
			fileName: this.text(record.fileName, 255, 'File name'),
			mimeType: this.text(record.mimeType, 255, 'File type'),
			data: record.data,
		};
	}

	private record(value: unknown): Record<string, unknown> {
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			throw new Error('Cloud input is invalid.');
		}
		return value as Record<string, unknown>;
	}

	private uuid(value: unknown): string {
		if (
			typeof value !== 'string' ||
			!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
		) {
			throw new Error('Cloud identifier is invalid.');
		}
		return value;
	}

	private text(value: unknown, maximumLength: number, label: string): string {
		if (typeof value !== 'string' || !value.trim() || value.length > maximumLength) {
			throw new Error(`${label} is invalid.`);
		}
		return value.trim();
	}
}
