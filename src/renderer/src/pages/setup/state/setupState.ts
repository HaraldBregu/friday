import type { ModelServiceStateMap, SetupStep } from '../types';

export type SetupState = {
	step: SetupStep;
	serviceStates: ModelServiceStateMap;
	loadingModels: boolean;
	savingConfig: boolean;
	errorMessage: string;
};
