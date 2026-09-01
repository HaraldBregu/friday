import { SETUP_STEPS } from '../../../src/renderer/src/pages/start/setupConstants';

it('does not include an object-storage provider step in onboarding', () => {
	expect(SETUP_STEPS).not.toContain('storage');
});
