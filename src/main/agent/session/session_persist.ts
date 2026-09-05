import type { SessionState } from './session_types';
import { ensureSession } from './session_ensure_session';
import { externalizeAttachments } from './session_externalize_attachments';
import { messagesBackupFilePath } from './session_messages_backup_file_path';
import { messagesFilePath } from './session_messages_file_path';
import { writeMessagesFile } from './session_write_messages';

export function persist(state: SessionState): void {
	if (!state.sessionsPath || (state.lease && !state.lease.active)) return;
	const messages =
		state.lease && state.pendingMessages
			? [...state.lease.messages, ...state.pendingMessages]
			: state.messages;
	ensureSession(state);
	writeMessagesFile(
		messagesFilePath(state),
		messagesBackupFilePath(state),
		`${JSON.stringify(externalizeAttachments(messages, state), null, '\t')}\n`
	);
	if (state.lease && state.pendingMessages) {
		state.lease.messages.push(...state.pendingMessages);
		state.messages = state.lease.messages;
		state.pendingMessages = undefined;
	}
}
