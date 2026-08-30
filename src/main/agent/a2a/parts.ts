import type { Part } from '@a2a-js/sdk';

export function assertA2aPartsSize(parts: Part[], currentBytes = 0): number {
	const total = currentBytes + Buffer.byteLength(JSON.stringify(parts));
	if (total > 200_000) throw new Error('A2A response exceeded the 200 KB limit.');
	return total;
}
