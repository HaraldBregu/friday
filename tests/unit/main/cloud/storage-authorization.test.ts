const startStorageSync = jest.fn();
const stopStorageSync = jest.fn();

jest.mock('../../../../src/main/storage/storage_sync_schedule', () => ({
	startStorageSync,
	stopStorageSync,
}));

import { bindStorageSyncToAccount } from '../../../../src/main/storage/authorization';
import type { AuthState } from '../../../../src/shared/auth_types';

it('runs scheduled storage work only while signed in', () => {
	let state: AuthState = { status: 'loading', persistence: 'memory' };
	let listener: ((next: AuthState) => void) | undefined;
	const unsubscribe = jest.fn();
	const auth = {
		getState: () => state,
		onStateChanged: (next: (value: AuthState) => void) => {
			listener = next;
			return unsubscribe;
		},
	};
	const logger = { info: jest.fn(), error: jest.fn() };
	const operations = {} as never;

	const unbind = bindStorageSyncToAccount(auth, logger, operations);
	expect(stopStorageSync).toHaveBeenCalledTimes(1);

	state = { status: 'signedIn', persistence: 'encrypted', user: { id: 'u1', email: 'a@b.c' } };
	listener?.(state);
	expect(startStorageSync).toHaveBeenCalledWith(logger, operations);

	state = { status: 'recovery', persistence: 'encrypted', user: { id: 'u1', email: 'a@b.c' } };
	listener?.(state);
	expect(stopStorageSync).toHaveBeenCalledTimes(2);

	unbind();
	expect(unsubscribe).toHaveBeenCalledTimes(1);
	expect(stopStorageSync).toHaveBeenCalledTimes(3);
});
