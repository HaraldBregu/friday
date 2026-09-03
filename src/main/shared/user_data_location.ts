import path from 'node:path';
import os from 'node:os';

export function userDataLocation(): string {
	const testLocation = process.env.FRIDAY_E2E_DATA_ROOT?.trim();
	if (testLocation) return path.resolve(testLocation);
	return path.join(os.homedir(), '.friday');
}
