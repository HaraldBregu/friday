import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadLocalEnvironment } from '../../../../src/main/cloud/environment';

const variable = 'KUCEDR_ENVIRONMENT_TEST_VALUE';
const originalValue = process.env[variable];
const originalCwd = process.cwd();
const temporaryDirectories: string[] = [];

beforeEach(() => {
	delete process.env[variable];
});

afterAll(() => {
	process.chdir(originalCwd);
	for (const directory of temporaryDirectories) rmSync(directory, { recursive: true, force: true });
	if (originalValue === undefined) delete process.env[variable];
	else process.env[variable] = originalValue;
});

it('loads the fixed application-path environment while unpackaged', () => {
	const directory = mkdtempSync(path.join(os.tmpdir(), 'kucedr-env-app-'));
	temporaryDirectories.push(directory);
	writeFileSync(path.join(directory, '.env'), `${variable}=from-app\n`);

	loadLocalEnvironment(directory, false);

	expect(process.env[variable]).toBe('from-app');
});

it('does not load an environment from the current working directory', () => {
	const appDirectory = mkdtempSync(path.join(os.tmpdir(), 'kucedr-env-app-'));
	const workingDirectory = mkdtempSync(path.join(os.tmpdir(), 'kucedr-env-cwd-'));
	temporaryDirectories.push(appDirectory, workingDirectory);
	writeFileSync(path.join(workingDirectory, '.env'), `${variable}=from-cwd\n`);
	process.chdir(workingDirectory);

	loadLocalEnvironment(appDirectory, false);

	expect(process.env[variable]).toBeUndefined();
});

it('does not load a local environment in a packaged application', () => {
	const directory = mkdtempSync(path.join(os.tmpdir(), 'kucedr-env-packaged-'));
	temporaryDirectories.push(directory);
	writeFileSync(path.join(directory, '.env'), `${variable}=from-package\n`);

	loadLocalEnvironment(directory, true);

	expect(process.env[variable]).toBeUndefined();
});
