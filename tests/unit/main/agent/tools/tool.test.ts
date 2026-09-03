import { jsonTool } from '../../../../../src/main/agent/tools/tool';

it('does not cut native tools off at thirty seconds by default', () => {
	const nativeTool = jsonTool({
		id: 'long_operation',
		name: 'Long operation',
		description: 'Long operation',
		schema: { type: 'object' },
		execute: () => undefined,
	});

	expect(nativeTool.timeoutMs).toBe(10 * 60_000);
});

it('keeps the runtime ID separate from the human-readable name', () => {
	const configured = jsonTool({
		id: 'coordinated',
		name: 'Coordinated operation',
		description: 'read safely',
		schema: { type: 'object' },
		execute: () => undefined,
	});

	expect(configured.id).toBe('coordinated');
	expect(configured.name).toBe('Coordinated operation');
	expect(configured.schema).toEqual({ type: 'object' });
});
