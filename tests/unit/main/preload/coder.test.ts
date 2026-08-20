const invoke = jest.fn();
const on = jest.fn();
const removeListener = jest.fn();

jest.mock('electron', () => ({
	ipcRenderer: { invoke, on, removeListener },
}));

import { coder } from '../../../../src/preload/coder';
import { CoderChannels } from '../../../../src/shared/ipc_channels_definitions';

beforeEach(() => {
	jest.clearAllMocks();
	invoke.mockResolvedValue({ success: true, data: 'reply' });
});

it('normalizes prompts, generates a run id, and removes the exact event listener', async () => {
	const callback = jest.fn();
	await expect(coder.send(' inspect ', callback)).resolves.toBe('reply');

	const runId = invoke.mock.calls[0][2];
	expect(invoke).toHaveBeenCalledWith(CoderChannels.send, 'inspect', expect.any(String));
	expect(on).toHaveBeenCalledWith(CoderChannels.response, expect.any(Function));
	expect(removeListener).toHaveBeenCalledWith(CoderChannels.response, on.mock.calls[0][1]);
	expect(runId).toHaveLength(36);
	expect(() => coder.send(' ')).toThrow('Invalid coder prompt.');
});

it('validates settings before forwarding them to main', () => {
	expect(() =>
		coder.saveSettings({
			runtime: 'pi',
			providerId: 'unsupported',
			modelId: 'model',
			thinkingLevel: 'medium',
			toolMode: 'read-only',
			workingDirectory: '/project',
		} as never)
	).toThrow('Invalid coder settings.');
});
