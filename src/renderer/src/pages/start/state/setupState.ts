import type { ModelServiceStateMap, SetupStep } from '../setupTypes';

export type SetupState = {
	step: SetupStep;
	serviceStates: ModelServiceStateMap;
	loadingModels: boolean;
	savingConfig: boolean;
	errorMessage: string;
};
