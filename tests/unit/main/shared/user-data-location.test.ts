import os from 'node:os';
import path from 'node:path';

import { userDataLocation } from '../../../../src/main/shared/user_data_location';

describe('userDataLocation', () => {
	it('keeps persistent Friday data in the user profile', () => {
		expect(userDataLocation()).toBe(path.join(os.homedir(), '.friday'));
	});

	it('uses the isolated E2E data root when configured', () => {
		const previous = process.env.FRIDAY_E2E_DATA_ROOT;
		process.env.FRIDAY_E2E_DATA_ROOT = './test-data';

		try {
			expect(userDataLocation()).toBe(path.resolve('./test-data'));
		} finally {
			if (previous === undefined) delete process.env.FRIDAY_E2E_DATA_ROOT;
			else process.env.FRIDAY_E2E_DATA_ROOT = previous;
		}
	});
});
