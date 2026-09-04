const listApps = jest.fn();
const loadApp = jest.fn();
const closeApp = jest.fn();

jest.mock('../../../../../src/main/apps/app_index', () => ({
	closeApp,
	listApps,
	loadApp,
}));

import { closeAppsTool } from '../../../../../src/main/agent/tools/apps/close_apps';
import { listAppsTool } from '../../../../../src/main/agent/tools/apps/list_apps';
import { openAppsTool } from '../../../../../src/main/agent/tools/apps/open_apps';
import type { WindowFactory } from '../../../../../src/main/window_factory';
import type { App } from '../../../../../src/shared/installed_app_types';

const project: App = {
	id: 'project',
	title: 'Project',
	description: 'Project board',
	metadata: { version: '1.0.0', category: 'productivity', entry: 'index.html' },
};
const weather: App = {
	id: 'weather',
	title: 'Weather',
	description: 'Weather dashboard',
	metadata: { version: '1.0.0', category: 'utility', entry: 'index.html' },
};
const windowFactory = {} as WindowFactory;

beforeEach(() => {
	jest.clearAllMocks();
	closeApp.mockReturnValue(true);
	listApps.mockReturnValue([project, weather]);
});

it('lists installed apps and defines the tool identity', async () => {
	await expect(listAppsTool.run({})).resolves.toEqual({ apps: [project, weather] });
	expect(listAppsTool).toMatchObject({
		id: 'list_apps',
		name: 'List apps',
	});
});

it.each([
	['one app', 'project', [project]],
	['multiple apps', ['project', 'weather'], [project, weather]],
] as const)('opens %s by exact ID', async (_label, ids, expected) => {
	const appTool = openAppsTool(windowFactory);

	await expect(appTool.run({ ids })).resolves.toEqual({
		opened: expected.map((app) => app.id),
	});
	expect(loadApp.mock.calls).toEqual(expected.map((app) => [windowFactory, app]));
});

it('rejects missing IDs before opening any app', async () => {
	const appTool = openAppsTool(windowFactory);

	await expect(appTool.run({ ids: ['project', 'missing'] })).rejects.toThrow(
		'Apps not found: missing'
	);
	expect(loadApp).not.toHaveBeenCalled();
});

it('defines the app open tool identity', () => {
	expect(openAppsTool(windowFactory)).toMatchObject({
		id: 'open_apps',
		name: 'Open apps',
	});
});

it('requests closing open apps and reports IDs that are not open', async () => {
	closeApp.mockImplementation((id: string) => id === 'project');

	await expect(
		closeAppsTool.run({ ids: ['project', 'weather', 'project'] })
	).resolves.toEqual({
		requested: ['project'],
		notOpen: ['weather'],
	});
	expect(closeApp.mock.calls).toEqual([['project'], ['weather']]);
});

it('accepts one app ID when requesting a close', async () => {
	await expect(closeAppsTool.run({ ids: 'project' })).resolves.toEqual({
		requested: ['project'],
		notOpen: [],
	});
	expect(closeApp).toHaveBeenCalledWith('project');
});

it('stops requesting app closes when aborted', async () => {
	const controller = new AbortController();
	closeApp.mockImplementation(() => {
		controller.abort();
		return true;
	});

	await expect(
		closeAppsTool.run({ ids: ['project', 'weather'] }, controller.signal)
	).rejects.toMatchObject({ name: 'AbortError' });
	expect(closeApp).toHaveBeenCalledTimes(1);
});

it('rejects empty app close inputs', () => {
	expect(() => closeAppsTool.parseInput({ ids: '' })).toThrow();
	expect(() => closeAppsTool.parseInput({ ids: [] })).toThrow();
});

it('defines the app close tool identity', () => {
	expect(closeAppsTool).toMatchObject({
		id: 'close_apps',
		name: 'Close apps',
	});
});
