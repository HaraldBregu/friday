import { z } from 'zod';
import { undoFileOperation } from '../../history/undo';
import type { FileHistory } from '../../history/types';
import { tool } from '../tool';

export function undoFileTool(history: FileHistory) {
	return tool({
		id: 'undo',
		name: 'Undo file operation',
		description:
			'Undo the most recent write, edit, or patch operation in this session. Refuses if a file changed afterward.',
		hardApproval: true,
		inputSchema: z.object({}),
		execute: () => {
			const operation = undoFileOperation(history);
			return {
				operationId: operation.id,
				toolName: operation.toolName,
				restored: operation.before.map((file) => file.path),
			};
		},
	});
}
