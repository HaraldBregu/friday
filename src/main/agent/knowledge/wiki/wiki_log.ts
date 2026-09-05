import { readKnowledgeText } from '../read';
import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import type { WikiApplyResult, WikiSource } from './types';

export async function appendWikiLog(
	targetPath: string,
	source: WikiSource,
	result: WikiApplyResult,
	operationId?: string,
	operation = 'ingest',
	title = source.relativePath
): Promise<void> {
	const logPath = path.resolve(targetPath, 'log.md');
	if (operationId) {
		const existing = await readKnowledgeText(targetPath, 'log.md', undefined, true);
		if (existing.includes(`- Operation ID: ${operationId}`)) return;
	}
	const now = new Date();
	const date = now.toISOString().slice(0, 10);
	const entry = `## [${date}] ${operation} | ${title}

- Source hash: \`${source.hash}\`
- Source ID: ${source.sourceId ?? 'legacy'}
- Pages created: ${result.createdPages}
- Pages updated: ${result.updatedPages}
- Claims added: ${result.claimsAdded ?? 0}
- Contradictions: ${result.contradictionsDetected ?? 0}
- Review: ${result.pendingReviews ? 'required' : 'not required'}
- Operation ID: ${operationId ?? 'legacy'}
- Completed: ${now.toISOString()}

`;
	await appendFile(logPath, entry, 'utf8');
}
