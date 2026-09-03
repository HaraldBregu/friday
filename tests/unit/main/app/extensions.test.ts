import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { BrowserWindow, WebContentsView } from 'electron';
import type { WindowFactory } from '../../../../src/main/window_factory';
import {
	ensureExtensions,
	listExtensions,
	loadExtension,
} from '../../../../src/main/extensions/extension_index';
import { extensionEntryPath } from '../../../../src/main/extensions/extension_entry';
import { extensionManifestPath } from '../../../../src/main/extensions/extension_manifest';
import type { ExtensionManifest } from '../../../../src/main/extensions/extension_types';

function createWindowHarness() {
	const handlers = new Map<string, () => void>();
	const shellHandlers = new Map<string, () => void>();
	const webContents = {
		isDestroyed: jest.fn(() => false),
		on: jest.fn((event: string, handler: () => void) => shellHandlers.set(event, handler)),
		once: jest.fn((event: string, handler: () => void) => shellHandlers.set(event, handler)),
		send: jest.fn(),
	};
	const viewWebContents = {
		close: jest.fn(),
		isDestroyed: jest.fn(() => false),
		on: jest.fn(),
		once: jest.fn(),
		send: jest.fn(),
	};
	const view = {
		setBounds: jest.fn(),
		setVisible: jest.fn(),
		webContents: viewWebContents,
	} as unknown as WebContentsView;
	const win = {
		close: jest.fn(),
		contentView: { addChildView: jest.fn() },
		destroy: jest.fn(),
		focus: jest.fn(),
		getContentBounds: jest.fn(() => ({ x: 0, y: 0, width: 820, height: 640 })),
		isDestroyed: jest.fn(() => false),
		isMinimized: jest.fn(() => false),
		isVisible: jest.fn(() => true),
		restore: jest.fn(),
		setMenuBarVisibility: jest.fn(),
		setTitle: jest.fn(),
		show: jest.fn(),
		once: jest.fn((event: string, handler: () => void) => handlers.set(event, handler)),
		on: jest.fn((event: string, handler: () => void) => handlers.set(event, handler)),
		webContents,
	} as unknown as BrowserWindow;
	const create = jest.fn(() => win);
	const load = jest.fn(() => Promise.resolve());
	const createView = jest.fn(() => ({ view, load }));
	const windowFactory = { create, createView } as unknown as WindowFactory;
	return { create, createView, handlers, load, shellHandlers, view, win, windowFactory };
}

function installExtension(
	appLocation: string,
	id: string,
	manifest: ExtensionManifest,
	contents = '<h1>Extension</h1>'
): string {
	const entry = extensionEntryPath(id, manifest.metadata.entry, appLocation);
	fs.mkdirSync(path.dirname(entry), { recursive: true });
	fs.writeFileSync(entry, contents);
	fs.writeFileSync(extensionManifestPath(id, appLocation), JSON.stringify(manifest));
	return entry;
}

describe('extension discovery and loading', () => {
	let appLocation: string;
	const projectManifest: ExtensionManifest = {
		title: 'Project',
		description: 'A compact project board for tracking work from backlog to completion.',
		metadata: {
			version: '1.0.0',
			category: 'project-management',
			entry: 'index.html',
		},
	};

	beforeEach(() => {
		appLocation = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-extensions-'));
	});

	afterEach(() => {
		fs.rmSync(appLocation, { recursive: true, force: true });
	});

	it('initializes an empty extension directory', () => {
		expect(ensureExtensions(appLocation)).toEqual([]);
		expect(fs.readdirSync(path.join(appLocation, 'extensions'))).toEqual([]);
	});

	it('discovers extension folders from their manifests', () => {
		installExtension(appLocation, 'project', projectManifest);

		expect(listExtensions(appLocation)).toEqual([{ id: 'project', ...projectManifest }]);
	});

	it('uses metadata.entry and preserves additional metadata', () => {
		const manifest: ExtensionManifest = {
			...projectManifest,
			metadata: {
				...projectManifest.metadata,
				entry: 'pages/project.html',
				author: 'Kucedr',
			},
		};
		installExtension(appLocation, 'project', manifest);

		expect(listExtensions(appLocation)).toEqual([{ id: 'project', ...manifest }]);
	});

	it('sorts discovered extensions by folder name', () => {
		installExtension(appLocation, 'weather', { ...projectManifest, title: 'Weather' });
		installExtension(appLocation, 'clock', { ...projectManifest, title: 'Clock' });

		expect(listExtensions(appLocation).map(({ id }) => id)).toEqual(['clock', 'weather']);
	});

	it('omits folders whose manifest is missing or invalid', () => {
		const entry = extensionEntryPath('notes', 'index.html', appLocation);
		fs.mkdirSync(path.dirname(entry), { recursive: true });
		fs.writeFileSync(entry, '<h1>Notes</h1>');
		expect(listExtensions(appLocation)).toEqual([]);

		fs.writeFileSync(
			extensionManifestPath('notes', appLocation),
			JSON.stringify({ name: 'Notes', description: 'Old schema', metadata: {} })
		);
		expect(listExtensions(appLocation)).toEqual([]);
	});

	it('omits extensions whose manifest entry is missing or unsafe', () => {
		fs.mkdirSync(path.dirname(extensionManifestPath('missing', appLocation)), { recursive: true });
		fs.writeFileSync(
			extensionManifestPath('missing', appLocation),
			JSON.stringify(projectManifest)
		);
		fs.mkdirSync(path.dirname(extensionManifestPath('unsafe', appLocation)), { recursive: true });
		fs.writeFileSync(
			extensionManifestPath('unsafe', appLocation),
			JSON.stringify({
				...projectManifest,
				metadata: { ...projectManifest.metadata, entry: '../outside.html' },
			})
		);

		expect(listExtensions(appLocation)).toEqual([]);
	});

	it('loads the manifest entry below the extension titlebar', async () => {
		const manifest: ExtensionManifest = {
			...projectManifest,
			metadata: { ...projectManifest.metadata, entry: 'pages/project.html' },
		};
		const entry = installExtension(appLocation, 'project', manifest);
		const extension = { id: 'project', ...manifest };
		const { create, createView, handlers, load, shellHandlers, view, win, windowFactory } =
			createWindowHarness();

		expect(loadExtension(windowFactory, extension, appLocation)).toBe(win);
		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({
				frame: false,
				title: 'Project',
				resizable: true,
			}),
			{ html: 'extension.html', hash: 'extension/Project' }
		);
		expect(createView).not.toHaveBeenCalled();

		shellHandlers.get('did-finish-load')?.();
		expect(createView).toHaveBeenCalledWith(entry, 'project');
		expect(win.contentView.addChildView).toHaveBeenCalledWith(view);
		expect(view.setBounds).toHaveBeenCalledWith({ x: 0, y: 48, width: 820, height: 592 });
		expect(load).toHaveBeenCalledTimes(1);
		handlers.get('ready-to-show')?.();
		await new Promise((resolve) => setImmediate(resolve));
		expect(win.show).toHaveBeenCalledTimes(1);
		handlers.get('closed')?.();
	});

	it('does not open a window when the manifest entry is missing', () => {
		const extension = { id: 'project', ...projectManifest };
		const { create, windowFactory } = createWindowHarness();

		expect(() => loadExtension(windowFactory, extension, appLocation)).toThrow(
			'Extension entry not found: project'
		);
		expect(create).not.toHaveBeenCalled();
	});

	it('reuses an extension window while its titlebar is still loading', () => {
		const manifest: ExtensionManifest = {
			...projectManifest,
			metadata: { ...projectManifest.metadata, entry: 'pages/project.html' },
		};
		installExtension(appLocation, 'project', manifest);
		const extension = { id: 'project', ...manifest };
		const { create, createView, handlers, win, windowFactory } = createWindowHarness();

		const firstWindow = loadExtension(windowFactory, extension, appLocation);
		expect(firstWindow).toBe(win);
		expect(create).toHaveBeenCalledTimes(1);

		const secondWindow = loadExtension(windowFactory, extension, appLocation);
		expect(secondWindow).toBe(win);
		expect(create).toHaveBeenCalledTimes(1);
		expect(createView).not.toHaveBeenCalled();
		expect(win.focus).toHaveBeenCalledTimes(1);
		expect(win.show).toHaveBeenCalledTimes(0);
		expect(win.isDestroyed).toHaveBeenCalledTimes(1);
		expect(win.isMinimized).toHaveBeenCalledTimes(1);
		expect(win.isVisible).not.toHaveBeenCalled();
		handlers.get('closed')?.();
	});

	it('rejects extension paths outside the extensions folder', () => {
		expect(() => extensionEntryPath('../outside', 'index.html', appLocation)).toThrow(
			'Invalid extension id'
		);
		expect(() => extensionEntryPath('project', '../outside.html', appLocation)).toThrow(
			'Invalid extension entry'
		);
	});
});
