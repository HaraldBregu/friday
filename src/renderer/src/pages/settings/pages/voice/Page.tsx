import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { providerIdsFor, providerModels, providers } from '@/lib/providers';
import { ModelOptions } from '@/components/model-options';
import { updateModelOptions } from '@/lib/options';
import type { PublicProvider } from '../../../../../../shared';
import {
	SettingsNotice,
	SettingsPageHeader,
	SettingsPageShell,
	SettingsSection,
} from '../../components';
import { ModelProviderConfiguration } from '../../components/model-configuration';
import {
	firstErrorMessage,
	initialModelConfigurationState,
	mergeModels,
	mergeProviders,
	type ModelConfigurationState,
} from '../../components/model-configuration-state';
import type { ProviderModelGroup } from '../../../start/setupTypes';
import type { Model, ModelSelection } from '@/lib/compat';
import VoiceTest from './VoiceTest';
import RealtimeVoiceConfiguration from './Realtime';

const VOICE_CONTENT_INPUTS = new Set(['input', 'model', 'model_id', 'text', 'transcript']);

type CatalogProvider = PublicProvider;

function getCatalogProviderById(providerId: string): CatalogProvider | undefined {
	return providers().find((provider) => provider.id === providerId);
}

function getVoiceModels(providerId: string): Model[] {
	return providerModels(providerId, 'text-to-speech');
}

async function getVoiceSelection(): Promise<ModelSelection | undefined> {
	const [providerId, modelId] = await Promise.all([
		window.models.voice.getProviderId(),
		window.models.voice.getModelId(),
	]);
	if (!providerId || !modelId) return undefined;
	const provider = getCatalogProviderById(providerId);
	const model = getVoiceModels(providerId).find((item) => item.id === modelId);
	if (!provider || !model) return undefined;
	return { provider, model };
}

async function saveVoiceSelection(provider: PublicProvider, model: Model): Promise<boolean> {
	await window.models.voice.setProviderId(provider.id);
	await window.models.voice.setModelId(model.id);
	return true;
}

const VoicePage: React.FC = () => {
	const { t } = useTranslation();
	const [state, setState] = useState<ModelConfigurationState>(initialModelConfigurationState);
	const [options, setOptions] = useState<Record<string, unknown>>({});
	const selectedModel = providerModels(state.providerId, 'text-to-speech').find(
		(model) => model.id === state.modelId
	);
	const inputs =
		selectedModel?.metadata?.documentationStatus === 'verified'
			? selectedModel.metadata.inputs
			: {};

	useEffect(() => {
		let mounted = true;

		async function loadService(): Promise<void> {
			setState((current) => ({
				...current,
				loading: true,
				loadingModels: true,
				saved: false,
				error: null,
			}));

			try {
				const [selection, storedOptions] = await Promise.all([
					getVoiceSelection(),
					window.models.voice.getOptions(),
				]);
				const providers = providerIdsFor('text-to-speech').flatMap((providerId) => {
					const provider = getCatalogProviderById(providerId);
					return provider ? [provider] : [];
				});
				const mergedProviders = mergeProviders(providers, selection?.provider);
				if (!mounted) return;

				const modelGroups: ProviderModelGroup[] = [];
				let firstModelError: unknown;

				for (const provider of mergedProviders) {
					try {
						const models = getVoiceModels(provider.id);
						const nextModels =
							selection?.provider.id === provider.id
								? mergeModels(models, selection.model)
								: models;
						if (nextModels.length > 0) modelGroups.push({ provider, models: nextModels });
					} catch (error) {
						firstModelError ??= error;
					}
				}

				if (!mounted) return;
				const preferredGroup =
					modelGroups.find((group) => group.provider.id === selection?.provider.id) ??
					modelGroups[0];
				const preferredModel =
					preferredGroup?.models.find((model) => model.id === selection?.model.id) ??
					preferredGroup?.models[0];

				setState({
					providers: mergedProviders,
					modelGroups,
					providerId: preferredGroup?.provider.id ?? '',
					modelId: preferredModel?.id ?? '',
					loading: false,
					loadingModels: false,
					saving: false,
					saved: false,
					error: firstModelError
						? firstErrorMessage(firstModelError, t('settings.modelServices.modelsLoadError'))
						: null,
				});
				setOptions(
					preferredGroup?.provider.id === selection?.provider.id &&
						preferredModel?.id === selection?.model.id
						? storedOptions
						: {}
				);
			} catch (error) {
				if (!mounted) return;
				setState({
					...initialModelConfigurationState,
					loading: false,
					loadingModels: false,
					error: firstErrorMessage(error, t('settings.modelServices.loadError')),
				});
			}
		}

		void loadService();
		return () => {
			mounted = false;
		};
	}, [t]);

	const handleChange = async (nextProviderId: string, nextModelId: string): Promise<void> => {
		const group = state.modelGroups.find((item) => item.provider.id === nextProviderId);
		const model = group?.models.find((item) => item.id === nextModelId);
		if (!group || !model) return;
		setOptions({});
		setState((current) => ({
			...current,
			providerId: nextProviderId,
			modelId: nextModelId,
			saving: true,
			saved: false,
			error: null,
		}));
		try {
			const didSave = await saveVoiceSelection(group.provider, model);
			if (!didSave) throw new Error(t('settings.modelServices.saveError'));
			await window.models.voice.setOptions({});
			setState((current) => ({ ...current, saving: false, saved: true }));
		} catch (error) {
			setState((current) => ({
				...current,
				saving: false,
				error: firstErrorMessage(error, t('settings.modelServices.saveError')),
			}));
		}
	};

	const handleOptionChange = (path: readonly string[], value: unknown): void => {
		const next = updateModelOptions(options, path, value);
		setOptions(next);
		void window.models.voice.setOptions(next).catch((error) => {
			setState((current) => ({
				...current,
				error: firstErrorMessage(error, t('settings.modelServices.saveError')),
			}));
		});
	};

	return (
		<SettingsPageShell>
			<SettingsPageHeader
				title={t('settings.modelServices.voiceName')}
				description={t('settings.modelServices.voiceDescription')}
			/>

			{state.error && (
				<SettingsNotice variant="destructive" icon={AlertTriangle}>
					{state.error}
				</SettingsNotice>
			)}

			<SettingsSection title={t('settings.modelServices.configuration')}>
				<div className="grid gap-2">
					<RealtimeVoiceConfiguration />
					<ModelProviderConfiguration
						configState={state}
						idPrefix="voice"
						triggerTitle={t('settings.modelServices.readAloudConfiguration')}
						description={t('settings.modelServices.modelDescription')}
						onChange={(providerId, modelId) => void handleChange(providerId, modelId)}
					>
						<ModelOptions
							key={`${state.providerId}:${state.modelId}`}
							inputs={inputs}
							values={options}
							excludedInputs={VOICE_CONTENT_INPUTS}
							allowComplex
							onChange={handleOptionChange}
						/>
					</ModelProviderConfiguration>
				</div>
			</SettingsSection>

			<SettingsSection
				title={t('settings.modelServices.test')}
				description={t('settings.modelServices.testVoiceDescription')}
			>
				<VoiceTest />
			</SettingsSection>
		</SettingsPageShell>
	);
};

export default VoicePage;
