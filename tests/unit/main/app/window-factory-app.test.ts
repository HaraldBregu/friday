import { WebContentsView } from 'electron';
import { ExtensionRegistry } from '../../../../src/main/extensions/extension_registry';
import { extensionsRoot } from '../../../../src/main/extensions/extension_root';
import {
	EXTENSION_RESOURCE_SCHEME,
	EXTENSION_SESSION_PARTITION,
} from '../../../../src/main/protocol';
import { WindowFactory } from '../../../../src/main/window_factory';
import path from 'node:path';

it('registers an extension view before loading and removes it when destroyed', async () => {
	const handlers = new Map<string, () => void>();
	const contents = {
		id: 9,
		loadURL: jest.fn(async () => undefined),
		on: jest.fn(),
		once: jest.fn((event: string, handler: () => void) => handlers.set(event, handler)),
		setWindowOpenHandler: jest.fn(),
	};
	(WebContentsView as unknown as jest.Mock).mockImplementation(() => ({ webContents: contents }));
	const registry = new ExtensionRegistry();
	const factory = new WindowFactory(undefined, registry);

	const extension = factory.createView(path.join(extensionsRoot(), 'draw/index.html'), 'draw');
	expect(WebContentsView).toHaveBeenCalledWith({
		webPreferences: expect.objectContaining({ partition: EXTENSION_SESSION_PARTITION }),
	});
	expect(registry.resolve(contents)).toBe('draw');
	expect(contents.loadURL).not.toHaveBeenCalled();

	await extension.load();
	expect(contents.loadURL).toHaveBeenCalledWith(`${EXTENSION_RESOURCE_SCHEME}://draw/index.html`);
	handlers.get('destroyed')?.();
	expect(() => registry.resolve(contents)).toThrow('registered extension views');
});
