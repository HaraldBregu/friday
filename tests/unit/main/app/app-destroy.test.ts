import { destroyAllApps } from '../../../../src/main/apps/app_destroy_all';
import { openAppWindows } from '../../../../src/main/apps/app_render';

describe('app shutdown', () => {
	beforeEach(() => {
		(openAppWindows as Map<string, unknown>).clear();
	});

	afterEach(() => {
		(openAppWindows as Map<string, unknown>).clear();
	});

	it('force-destroys app windows without waiting for beforeunload', () => {
		const active = { isDestroyed: jest.fn(() => false), destroy: jest.fn() };
		const destroyed = { isDestroyed: jest.fn(() => true), destroy: jest.fn() };
		(openAppWindows as Map<string, unknown>).set('active', { window: active });
		(openAppWindows as Map<string, unknown>).set('destroyed', { window: destroyed });

		destroyAllApps();

		expect(active.destroy).toHaveBeenCalledTimes(1);
		expect(destroyed.destroy).not.toHaveBeenCalled();
	});
});
