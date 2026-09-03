import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const agentDir = path.join(os.tmpdir(), 'kucedr-media-save-test');

jest.mock('../../../../../src/main/shared/agent_location', () => ({
	agentLocation: (): string => agentDir,
}));

import { saveMedia } from '../../../../../src/main/agent/tools/media/save';

describe('saveMedia', () => {
	beforeEach(async () => {
		await fs.rm(agentDir, { recursive: true, force: true });
	});

	afterAll(async () => {
		await fs.rm(agentDir, { recursive: true, force: true });
	});

	it('saves into the agent directory when no directory is given', async () => {
		const filePath = await saveMedia('image', 'png', Buffer.from('pixels').toString('base64'));

		expect(path.dirname(filePath)).toBe(agentDir);
		expect(path.basename(filePath)).toMatch(/^image-\d+\.png$/);
		await expect(fs.readFile(filePath, 'utf8')).resolves.toBe('pixels');
	});

	it('saves into a requested directory resolved against the agent directory', async () => {
		const filePath = await saveMedia(
			'sound',
			'mp3',
			Buffer.from('waves').toString('base64'),
			'clips/today'
		);

		expect(path.dirname(filePath)).toBe(path.join(agentDir, 'clips', 'today'));
		await expect(fs.readFile(filePath, 'utf8')).resolves.toBe('waves');
	});
});
