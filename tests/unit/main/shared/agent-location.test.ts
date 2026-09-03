import path from 'node:path';

jest.mock('../../../../src/main/shared/user_data_location', () => ({
	userDataLocation: jest.fn(() => '/user/data'),
}));

import { agentLocation } from '../../../../src/main/shared/agent_location';

describe('agentLocation', () => {
	it('appends the workspace folder to the user data location', () => {
		expect(agentLocation()).toBe(path.join('/user/data', 'workspace'));
	});
});
