import { CoderStore, DEFAULT_CODER_SETTINGS } from '../../../../src/main/coder/store';

it('defaults to Pi, Codex, and read-only tools', () => {
	const store = new CoderStore('/tmp/friday-coder-store-test');

	expect(store.get()).toEqual(DEFAULT_CODER_SETTINGS);
});

it('persists valid runtime settings without project state', () => {
	const store = new CoderStore('/tmp/friday-coder-store-test');
	const saved = store.set({
		...DEFAULT_CODER_SETTINGS,
		providerId: 'anthropic',
		modelId: 'claude',
		toolMode: 'coding',
	});

	expect(store.get()).toEqual(saved);
	expect(store.get()).not.toHaveProperty('workingDirectory');
});
