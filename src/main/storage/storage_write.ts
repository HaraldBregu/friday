import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';

export async function storageWrite(target: string, data: Uint8Array): Promise<void> {
	const temporary = `${target}.kucedr-${randomUUID()}.tmp`;
	try {
		await fs.writeFile(temporary, data, { flag: 'wx' });
		await fs.rename(temporary, target);
	} catch (error) {
		await fs.rm(temporary, { force: true });
		throw error;
	}
}
