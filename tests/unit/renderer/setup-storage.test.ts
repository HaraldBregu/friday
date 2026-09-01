import { SETUP_STEPS } from '../../../src/renderer/src/pages/start/setupConstants';

it('only asks for model and search providers during onboarding', () => {
	expect(SETUP_STEPS).toEqual(['modelProvider', 'search', 'models']);
});
