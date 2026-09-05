import { existsSync, rmSync } from 'node:fs';
import { messagesFile } from './session_messages_file';
import { isUuid } from './session_is_uuid';
import { legacyFilePath } from './session_legacy_file_path';
import { sessionFolderName } from './session_session_folder_name';
import { sessionPath } from './session_session_path';
import { sessionsRoot } from './session_sessions_root';
import type { SessionCoordinator } from './coordinator';

export function deleteSessionBySessionId(sessionId: string, location: string, coordinator?: SessionCoordinator): void {
	const root = sessionsRoot(location);
	if (isUuid(sessionId)) coordinator?.invalidate(messagesFile(root, sessionId));
	if (isUuid(sessionId)) {
		const folderPath = sessionPath(root, sessionFolderName(sessionId));
		if (existsSync(folderPath)) rmSync(folderPath, { recursive: true, force: true });
	}
	const legacyPath = legacyFilePath(root, sessionId);
	if (existsSync(legacyPath)) rmSync(legacyPath, { force: true });
}
