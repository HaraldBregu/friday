import React, { useReducer } from 'react';
import { AlertCircle, ArrowRight, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ModelsStep } from './components/ModelsStep';
import { PresentationStep } from './components/PresentationStep';
import { ProviderStep } from './components/ProviderStep';
import { StepProgress } from './components/StepProgress';
import {
	actionableProviderCatalog,
	getErrorMessage,
	getSelectedServiceModel,
	SETUP_STEPS,
	STEP_COPY,
} from './constants';
import { useModelServices } from './hooks/useModelServices';
import { createInitialSetupState, setupReducer } from './state/reducer';

const StartPage: React.FC = () => {
	const navigate = useNavigate();
	const [state, dispatch] = useReducer(setupReducer, undefined, createInitialSetupState);
	const { step, serviceStates, loadingModels, savingConfig, errorMessage } = state;

	const { handleServiceChange, handleSaveModels } = useModelServices(state, dispatch);

	const stepIndex = SETUP_STEPS.indexOf(step);
	const canContinueModels =
		getSelectedServiceModel(serviceStates.assistant) !== undefined &&
		!loadingModels &&
		!savingConfig;
	const isBusy = savingConfig;

	function handleBack(): void {
		const previousStep = SETUP_STEPS[Math.max(0, stepIndex - 1)];
		dispatch({ type: 'GO_TO_STEP', step: previousStep });
	}

	function handleContinueModelProvider(): void {
		void window.provider
			.list()
			.then((storedProviders) => {
				const modelProviderIds = new Set(
					actionableProviderCatalog().map((provider) => provider.id)
				);
				const hasSavedKey = storedProviders.some(
					(provider) => modelProviderIds.has(provider.id) && provider.apiKey.trim().length > 0
			);
			if (hasSavedKey) {
				dispatch({ type: 'GO_TO_STEP', step: 'search' });
				} else {
					dispatch({
						type: 'SET_ERROR',
						message: 'Add at least one model provider API key to continue.',
					});
				}
			})
			.catch((error) => {
				dispatch({
					type: 'SET_ERROR',
					message: getErrorMessage(error, 'Could not check saved provider access.'),
				});
			});
	}

	function handlePrimaryAction(): void {
		if (step === 'presentation') {
			dispatch({ type: 'GO_TO_STEP', step: 'modelProvider' });
			return;
		}

		if (step === 'modelProvider') {
			handleContinueModelProvider();
			return;
		}

		if (step !== 'models') {
			const nextStep = SETUP_STEPS[stepIndex + 1];
			if (nextStep) dispatch({ type: 'GO_TO_STEP', step: nextStep });
			return;
		}

		void handleSaveModels().then((saved) => {
			if (saved) navigate('/home');
		});
	}

	function getPrimaryLabel(): string {
		if (step === 'presentation') return 'Get started';
		if (isBusy) return 'Saving...';
		if (stepIndex === SETUP_STEPS.length - 1) return 'Finish';
		return 'Continue';
	}

	function isPrimaryDisabled(): boolean {
		if (step === 'models') return !canContinueModels;
		return isBusy;
	}

	function renderStepContent(): React.JSX.Element {
		if (step === 'modelProvider') {
			return (
				<ProviderStep
					section="models"
					title={STEP_COPY.modelProvider.title}
					description={STEP_COPY.modelProvider.description}
				/>
			);
		}

		if (step === 'search') {
			return (
				<ProviderStep
					section="search"
					title={STEP_COPY.search.title}
					description={STEP_COPY.search.description}
				/>
			);
		}

		if (step === 'storage') {
			return (
				<ProviderStep
					section="storage"
					title={STEP_COPY.storage.title}
					description={STEP_COPY.storage.description}
				/>
			);
		}

		if (step === 'database') {
			return (
				<ProviderStep
					section="databases"
					title={STEP_COPY.database.title}
					description={STEP_COPY.database.description}
				/>
			);
		}

		if (step === 'models') {
			return (
				<ModelsStep
					serviceStates={serviceStates}
					loadingModels={loadingModels}
					savingConfig={savingConfig}
					onServiceChange={handleServiceChange}
				/>
			);
		}

		return <PresentationStep />;
	}

	return (
		<main className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
			<section className="min-h-0 flex-1 overflow-y-auto bg-muted/40 px-4 sm:px-6">
				{renderStepContent()}
				{errorMessage ? (
					<div className="mx-auto mb-4 flex max-w-2xl items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-destructive">
						<AlertCircle className="mt-0.5 size-3.5 shrink-0" />
						<p className="min-w-0 break-words text-xs font-medium leading-4">{errorMessage}</p>
					</div>
				) : null}
			</section>

			<footer className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-card/60 px-3 py-2 sm:px-5">
				<StepProgress currentIndex={stepIndex} />
				<div className="flex items-center gap-2">
					{step !== 'presentation' ? (
						<Button type="button" variant="outline" size="xs" disabled={isBusy} onClick={handleBack}>
							Back
						</Button>
					) : null}
					<Button
						type="button"
						size="sm"
						disabled={isPrimaryDisabled()}
						onClick={handlePrimaryAction}
					>
						{getPrimaryLabel()}
						{isBusy ? (
							<LoaderCircle className="size-3.5 animate-spin" />
						) : (
							<ArrowRight className="size-3.5" />
						)}
					</Button>
				</div>
			</footer>
		</main>
	);
};

export default StartPage;
