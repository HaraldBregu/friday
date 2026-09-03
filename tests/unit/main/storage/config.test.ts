import { normalizeStorageSettings } from '../../../../src/main/storage/storage_config';

const validConfig = {
	paths: ['/data/kucedr'],
	syncEnabled: true,
	syncCronExpression: '0 3 * * *',
};

describe('normalizeStorageSettings', () => {
	it('normalizes paths and cron whitespace', () => {
		expect(
			normalizeStorageSettings({
				...validConfig,
				paths: ['/data/kucedr/../kucedr', '/data/kucedr'],
				syncCronExpression: '0  3  * * *',
			})
		).toEqual(validConfig);
	});

	it.each([
		['relative folders', { paths: ['data/kucedr'] }],
		['filesystem roots', { paths: ['/'] }],
		['invalid schedules', { syncCronExpression: 'sometimes' }],
		['invalid enabled flags', { syncEnabled: 'yes' }],
	])('rejects %s', (_name, override) => {
		expect(() => normalizeStorageSettings({ ...validConfig, ...override })).toThrow();
	});
});
