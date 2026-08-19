import { normalizeStorageConfig } from '../../../../src/main/storage/storage_config';

const validConfig = {
	id: 'backup',
	name: 'Friday backup',
	endpoint: 'https://storage.example.com',
	region: 'us-east-1',
	accessKeyId: 'access',
	secretAccessKey: 'secret',
	bucket: 'friday',
	forcePathStyle: false,
	paths: ['/data/friday'],
	syncEnabled: true,
	syncCronExpression: '0 3 * * *',
};

describe('normalizeStorageConfig', () => {
	it('normalizes paths and cron whitespace', () => {
		expect(
			normalizeStorageConfig({
				...validConfig,
				paths: ['/data/friday/../friday', '/data/friday'],
				syncCronExpression: '0  3  * * *',
			})
		).toEqual(validConfig);
	});

	it.each([
		['relative folders', { paths: ['data/friday'] }],
		['filesystem roots', { paths: ['/'] }],
		['invalid schedules', { syncCronExpression: 'sometimes' }],
		['credential-bearing endpoints', { endpoint: 'https://user:pass@storage.example.com' }],
	])('rejects %s', (_name, override) => {
		expect(() => normalizeStorageConfig({ ...validConfig, ...override })).toThrow();
	});
});
