import { createHash } from 'node:crypto';
import { containsSecret } from '../knowledge/secrets';
import { MAX_MEMORY_FACT_LENGTH, type MemoryFact } from './memory_types';

export function memoryRecord(fact: string): MemoryFact {
	const normalized = fact.trim().replace(/\s+/gu, ' ');
	if (!normalized) throw new Error('Memory fact is required.');
	if (normalized.length > MAX_MEMORY_FACT_LENGTH) {
		throw new Error(`Memory fact must be ${MAX_MEMORY_FACT_LENGTH} characters or fewer.`);
	}
	if (containsSecret(normalized)) {
		throw new Error('Refusing to save credential-like content to memory.');
	}
	const digest = createHash('sha256').update(normalized).digest('hex').slice(0, 16);
	return { id: `memory-${digest}`, fact: normalized };
}
