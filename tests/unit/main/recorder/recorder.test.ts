import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, BrowserWindow } from 'electron';
import { createRecorder } from '../../../../src/main/recorder/recorder';

describe('recorder capture ownership', () => {
	let directory: string;

	beforeEach(async () => {
		jest.clearAllMocks();
		directory = await fs.mkdtemp(path.join(os.tmpdir(), 'friday-recorder-'));
	});

	afterEach(async () => {
		await fs.rm(directory, { recursive: true, force: true });
	});

	it('uses one trusted capture host and accepts completion only from that host', async () => {
		const firstContents = {
			id: 11,
			getURL: () => pathToFileURL(path.join(app.getAppPath(), 'out/renderer/index.html')).toString(),
			isDestroyed: () => false,
			send: jest.fn(),
		};
		const secondContents = { ...firstContents, id: 12, send: jest.fn() };
		jest.mocked(BrowserWindow.getAllWindows).mockReturnValue([
			{ isDestroyed: () => false, webContents: firstContents },
			{ isDestroyed: () => false, webContents: secondContents },
		] as never);
		const recorder = createRecorder({ command: 'capture:command', event: 'capture:event' });
		const output = path.join(directory, 'capture.webm');

		const recording = recorder.start({ url: output, duration: 1_000 });
		expect(firstContents.send).toHaveBeenCalledWith(
			'capture:command',
			expect.objectContaining({ type: 'start', id: recording.id })
		);
		expect(secondContents.send).not.toHaveBeenCalled();

		await expect(
			recorder.complete({ id: recording.id, base64: Buffer.from('wrong').toString('base64') }, 12)
		).rejects.toThrow('different capture host');
		await expect(fs.readFile(output)).rejects.toMatchObject({ code: 'ENOENT' });

		await recorder.complete(
			{ id: recording.id, base64: Buffer.from('recorded').toString('base64') },
			11
		);
		await expect(fs.readFile(output, 'utf8')).resolves.toBe('recorded');
	});
});
