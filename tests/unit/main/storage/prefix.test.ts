import { storagePrefix } from '../../../../src/main/storage/storage_prefix';

describe('storagePrefix', () => {
	it('isolates custom folders that have the same basename', () => {
		const first = storagePrefix('/data/first/project');
		const second = storagePrefix('/data/second/project');

		expect(first).toMatch(/^friday\/v1\/custom\/[a-f0-9]{12}-project\/$/);
		expect(second).toMatch(/^friday\/v1\/custom\/[a-f0-9]{12}-project\/$/);
		expect(first).not.toBe(second);
	});
});
