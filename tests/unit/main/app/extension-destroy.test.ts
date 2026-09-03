import { destroyAllExtensions } from '../../../../src/main/extensions/extension_destroy_all';
import { openExtensionWindows } from '../../../../src/main/extensions/extension_render';

describe('extension shutdown', () => {
	beforeEach(() => {
		(openExtensionWindows as Map<string, unknown>).clear();
	});

	afterEach(() => {
		(openExtensionWindows as Map<string, unknown>).clear();
	});

	it('force-destroys extension windows without waiting for beforeunload', () => {
		const active = { isDestroyed: jest.fn(() => false), destroy: jest.fn() };
		const destroyed = { isDestroyed: jest.fn(() => true), destroy: jest.fn() };
		(openExtensionWindows as Map<string, unknown>).set('active', { window: active });
		(openExtensionWindows as Map<string, unknown>).set('destroyed', { window: destroyed });

		destroyAllExtensions();

		expect(active.destroy).toHaveBeenCalledTimes(1);
		expect(destroyed.destroy).not.toHaveBeenCalled();
	});
});
