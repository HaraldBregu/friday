import path from 'node:path';
import { CoderStore, DEFAULT_CODER_SETTINGS } from '../../../../../src/main/coder/store';

it('defaults to Pi, Codex, and read-only tools', () => {
	const store = new CoderStore('/tmp/friday-coder-store-test');

	expect(store.get()).toEqual(DEFAULT_CODER_SETTINGS);
});

it('persists valid settings and rejects relative working directories', () => {
	const store = new CoderStore('/tmp/friday-coder-store-test');
	const saved = store.set({
		...DEFAULT_CODER_SETTINGS,
		providerId: 'anthropic',
		modelId: 'claude',
		toolMode: 'coding',
		workingDirectory: path.resolve('/tmp/project'),
	});

	expect(store.get()).toEqual(saved);
	expect(() =>
		store.set({ ...DEFAULT_CODER_SETTINGS, workingDirectory: 'relative/project' })
	).toThrow('absolute path');
});
