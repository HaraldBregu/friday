import { WebContentsView } from 'electron';
import { ExtensionRegistry } from '../../../../src/main/extensions/extension_registry';
import { WindowFactory } from '../../../../src/main/window_factory';

it('registers an extension view before loading and removes it when destroyed', async () => {
	const handlers = new Map<string, () => void>();
	const contents = {
		id: 9,
		loadFile: jest.fn(async () => undefined),
		on: jest.fn(),
		once: jest.fn((event: string, handler: () => void) => handlers.set(event, handler)),
		setWindowOpenHandler: jest.fn(),
	};
	(WebContentsView as unknown as jest.Mock).mockImplementation(() => ({ webContents: contents }));
	const registry = new ExtensionRegistry();
	const factory = new WindowFactory(undefined, registry);

	const extension = factory.createView('/extension/index.html', 'draw');
	expect(registry.resolve(contents)).toBe('draw');
	expect(contents.loadFile).not.toHaveBeenCalled();

	await extension.load();
	expect(contents.loadFile).toHaveBeenCalledWith('/extension/index.html');
	handlers.get('destroyed')?.();
	expect(() => registry.resolve(contents)).toThrow('registered extension views');
});
