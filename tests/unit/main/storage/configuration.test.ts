import { normalizeStorageConfiguration } from '../../../../src/main/storage/storage_configuration';

describe('normalizeStorageConfiguration', () => {
	it('normalizes the selected profile, paths, and schedule', () => {
		expect(
			normalizeStorageConfiguration({
				providerId: ' backup ',
				storageId: 'ignored-service-id',
				paths: ['/data/friday/../friday', '/data/friday'],
				syncEnabled: true,
				syncCronExpression: '0  3  * * *',
			})
		).toEqual({
			providerId: 'backup',
			storageId: undefined,
			paths: ['/data/friday'],
			syncEnabled: true,
			syncCronExpression: '0 3 * * *',
		});
	});

	it.each([
		['an empty profile ID', { providerId: ' ' }],
		['relative folders', { paths: ['data/friday'] }],
		['a non-boolean enabled flag', { syncEnabled: 'yes' }],
		['an invalid schedule', { syncCronExpression: 'sometimes' }],
	])('rejects %s', (_name, override) => {
		expect(() =>
			normalizeStorageConfiguration({
				providerId: 'backup',
				paths: ['/data/friday'],
				syncEnabled: false,
				syncCronExpression: '0 3 * * *',
				...override,
			})
		).toThrow();
	});
});
