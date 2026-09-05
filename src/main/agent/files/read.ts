import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { validateFilePath } from './validate';

export async function readFileBounded(
	filePath: string,
	maxBytes: number,
	signal?: AbortSignal
): Promise<Buffer> {
	signal?.throwIfAborted();
	if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) throw new Error('Invalid file byte limit.');
	const identities = validateFilePath(filePath);
	const selected = identities.at(-1);
	const handle = await open(
		filePath,
		constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK
	);
	try {
		signal?.throwIfAborted();
		const stat = await handle.stat();
		if (!stat.isFile()) throw new Error(`Expected a regular file: ${filePath}`);
		if (
			stat.dev !== selected?.dev ||
			stat.ino !== selected.ino ||
			JSON.stringify(validateFilePath(filePath)) !== JSON.stringify(identities)
		)
			throw new Error(`File identity changed before reading: ${filePath}`);
		if (stat.size > maxBytes)
			throw new Error(`File exceeds the ${maxBytes}-byte limit: ${filePath}`);
		const chunks: Buffer[] = [];
		let total = 0;
		while (true) {
			signal?.throwIfAborted();
			const buffer = Buffer.alloc(Math.min(64 * 1024, maxBytes - total + 1));
			const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
			if (bytesRead === 0) break;
			total += bytesRead;
			if (total > maxBytes) throw new Error(`File exceeds the ${maxBytes}-byte limit: ${filePath}`);
			chunks.push(buffer.subarray(0, bytesRead));
		}
		signal?.throwIfAborted();
		const after = await handle.stat();
		if (
			after.size !== stat.size ||
			after.mtimeMs !== stat.mtimeMs ||
			JSON.stringify(validateFilePath(filePath)) !== JSON.stringify(identities)
		)
			throw new Error(`File changed while reading: ${filePath}`);
		return Buffer.concat(chunks, total);
	} finally {
		await handle.close();
	}
}
