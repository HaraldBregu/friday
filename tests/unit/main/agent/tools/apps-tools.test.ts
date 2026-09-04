const listExtensions = jest.fn();
const loadExtension = jest.fn();
const closeExtension = jest.fn();

jest.mock('../../../../../src/main/extensions/extension_index', () => ({
	closeExtension,
	listExtensions,
	loadExtension,
}));

import { closeExtensionsTool } from '../../../../../src/main/agent/tools/extensions/close_extensions';
import { listExtensionsTool } from '../../../../../src/main/agent/tools/extensions/list_extensions';
import { openExtensionsTool } from '../../../../../src/main/agent/tools/extensions/open_extensions';
import type { WindowFactory } from '../../../../../src/main/window_factory';
import type { Extension } from '../../../../../src/shared/extension_types';

const project: Extension = {
	id: 'project',
	title: 'Project',
	description: 'Project board',
	metadata: { version: '1.0.0', category: 'productivity', entry: 'index.html' },
};
const weather: Extension = {
	id: 'weather',
	title: 'Weather',
	description: 'Weather dashboard',
	metadata: { version: '1.0.0', category: 'utility', entry: 'index.html' },
};
const windowFactory = {} as WindowFactory;

beforeEach(() => {
	jest.clearAllMocks();
	closeExtension.mockReturnValue(true);
	listExtensions.mockReturnValue([project, weather]);
});

it('lists installed extensions and defines the tool identity', async () => {
	await expect(listExtensionsTool.run({})).resolves.toEqual({ extensions: [project, weather] });
	expect(listExtensionsTool).toMatchObject({
		id: 'list_extensions',
		name: 'List extensions',
	});
});

it.each([
	['one extension', 'project', [project]],
	['multiple extensions', ['project', 'weather'], [project, weather]],
] as const)('opens %s by exact ID', async (_label, ids, expected) => {
	const extensionTool = openExtensionsTool(windowFactory);

	await expect(extensionTool.run({ ids })).resolves.toEqual({
		opened: expected.map((extension) => extension.id),
	});
	expect(loadExtension.mock.calls).toEqual(expected.map((extension) => [windowFactory, extension]));
});

it('rejects missing IDs before opening any extension', async () => {
	const extensionTool = openExtensionsTool(windowFactory);

	await expect(extensionTool.run({ ids: ['project', 'missing'] })).rejects.toThrow(
		'Extensions not found: missing'
	);
	expect(loadExtension).not.toHaveBeenCalled();
});

it('defines the extension open tool identity', () => {
	expect(openExtensionsTool(windowFactory)).toMatchObject({
		id: 'open_extensions',
		name: 'Open extensions',
	});
});

it('requests closing open extensions and reports IDs that are not open', async () => {
	closeExtension.mockImplementation((id: string) => id === 'project');

	await expect(
		closeExtensionsTool.run({ ids: ['project', 'weather', 'project'] })
	).resolves.toEqual({
		requested: ['project'],
		notOpen: ['weather'],
	});
	expect(closeExtension.mock.calls).toEqual([['project'], ['weather']]);
});

it('accepts one extension ID when requesting a close', async () => {
	await expect(closeExtensionsTool.run({ ids: 'project' })).resolves.toEqual({
		requested: ['project'],
		notOpen: [],
	});
	expect(closeExtension).toHaveBeenCalledWith('project');
});

it('stops requesting extension closes when aborted', async () => {
	const controller = new AbortController();
	closeExtension.mockImplementation(() => {
		controller.abort();
		return true;
	});

	await expect(
		closeExtensionsTool.run({ ids: ['project', 'weather'] }, controller.signal)
	).rejects.toMatchObject({ name: 'AbortError' });
	expect(closeExtension).toHaveBeenCalledTimes(1);
});

it('rejects empty extension close inputs', () => {
	expect(() => closeExtensionsTool.parseInput({ ids: '' })).toThrow();
	expect(() => closeExtensionsTool.parseInput({ ids: [] })).toThrow();
});

it('defines the extension close tool identity', () => {
	expect(closeExtensionsTool).toMatchObject({
		id: 'close_extensions',
		name: 'Close extensions',
	});
});
