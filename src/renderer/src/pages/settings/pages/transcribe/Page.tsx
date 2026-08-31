import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supportsSpeechToTextApiType } from '@/lib/providers';
import type { SpeechToTextApiType } from '../../../../../../shared/model_types';
import type { SttSelectionMode } from '../../../../../../shared/stt_transcription';
import type { Model } from '@/lib/compat';
import {
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
import { getProviderCatalogItem } from '../../../start/setupConstants';
import type { ProviderModelGroup } from '../../../start/setupTypes';
import TranscribeTest from './TranscribeTest';

type SpeechModeStateMap = Record<SttSelectionMode, ModelConfigurationState>;

interface SpeechModeConfig {
	readonly mode: SttSelectionMode;
	readonly titleKey: string;
	readonly descriptionKey: string;
	readonly modelDescriptionKey: string;
}

const SPEECH_MODE_CONFIGS: readonly SpeechModeConfig[] = [
	{
		mode: 'realtime',
		titleKey: 'settings.modelServices.realtimeConfiguration',
		descriptionKey: 'settings.modelServices.realtimeConfigurationDescription',
		modelDescriptionKey: 'settings.modelServices.realtimeModelDescription',
	},
	{
		mode: 'transcribe',
		titleKey: 'settings.modelServices.transcribeConfiguration',
		descriptionKey: 'settings.modelServices.transcribeConfigurationDescription',
		modelDescriptionKey: 'settings.modelServices.transcribeModelDescription',
	},
];

function speechModeApiType(mode: SttSelectionMode): SpeechToTextApiType {
	return mode === 'realtime' ? 'stream' : 'batch';
}

function speechModeModels(
	providerId: string,
	models: readonly Model[],
	mode: SttSelectionMode
): Model[] {
	const apiType = speechModeApiType(mode);
	return models.filter((model) => supportsSpeechToTextApiType(providerId, model.id, apiType));
}

async function loadSpeechModeState(
	mode: SttSelectionMode,
	fallbackErrorMessage: string,
	fallbackModelErrorMessage: string
): Promise<ModelConfigurationState> {
	try {
		const selection = await window.models.transcribe.getSelection(mode);
		const providers = mergeProviders(await window.models.transcribe.listProviders(), selection?.provider);
		const modelGroups: ProviderModelGroup[] = [];
		let firstModelError: unknown;

		for (const provider of providers) {
			try {
				const models = speechModeModels(
					provider.id,
					await window.models.transcribe.listModels(provider.id),
					mode
				);
				const nextModels =
					selection?.provider.id === provider.id &&
					supportsSpeechToTextApiType(
						provider.id,
						selection.model.id,
						speechModeApiType(mode)
					)
						? mergeModels(models, selection.model)
						: models;
				if (nextModels.length > 0) modelGroups.push({ provider, models: nextModels });
			} catch (error) {
				firstModelError ??= error;
			}
		}

		const preferredGroup =
			modelGroups.find((group) => group.provider.id === selection?.provider.id) ?? modelGroups[0];
		const preferredModel =
			preferredGroup?.models.find((model) => model.id === selection?.model.id) ??
			preferredGroup?.models[0];

		return {
			providers,
			modelGroups,
			providerId: preferredGroup?.provider.id ?? '',
			modelId: preferredModel?.id ?? '',
			loading: false,
			loadingModels: false,
			saving: false,
			saved: false,
			error: firstModelError
				? firstErrorMessage(firstModelError, fallbackModelErrorMessage)
				: null,
		};
	} catch (error) {
		return {
			...initialModelConfigurationState,
			loading: false,
			loadingModels: false,
			error: firstErrorMessage(error, fallbackErrorMessage),
		};
	}
}

const TranscribePage: React.FC = () => {
	const { t } = useTranslation();
	const [speechStates, setSpeechStates] = useState<SpeechModeStateMap>({
		realtime: initialModelConfigurationState,
		transcribe: initialModelConfigurationState,
	});

	useEffect(() => {
		let mounted = true;
		setSpeechStates({
			realtime: { ...initialModelConfigurationState, loading: true, loadingModels: true },
			transcribe: { ...initialModelConfigurationState, loading: true, loadingModels: true },
		});
		void Promise.all([
			loadSpeechModeState(
				'realtime',
				t('settings.modelServices.loadError'),
				t('settings.modelServices.modelsLoadError')
			),
			loadSpeechModeState(
				'transcribe',
				t('settings.modelServices.loadError'),
				t('settings.modelServices.modelsLoadError')
			),
		]).then(([realtime, transcribe]) => {
			if (mounted) setSpeechStates({ realtime, transcribe });
		});
		return () => {
			mounted = false;
		};
	}, [t]);

	const handleSpeechChange = async (
		mode: SttSelectionMode,
		nextProviderId: string,
		nextModelId: string
	): Promise<void> => {
		const modeState = speechStates[mode];
		const group = modeState.modelGroups.find((item) => item.provider.id === nextProviderId);
		const provider = group?.provider;
		const model = group?.models.find((item) => item.id === nextModelId);
		if (!provider || !model) return;

		setSpeechStates((current) => ({
			...current,
			[mode]: {
				...current[mode],
				providerId: nextProviderId,
				modelId: nextModelId,
				saving: true,
				saved: false,
				error: null,
			},
		}));
		try {
			const didSave = await window.models.transcribe.saveSelection(provider.id, model.id, mode);
			if (!didSave) throw new Error(t('settings.modelServices.saveError'));
			setSpeechStates((current) => ({
				...current,
				[mode]: { ...current[mode], saving: false, saved: true },
			}));
		} catch (error) {
			setSpeechStates((current) => ({
				...current,
				[mode]: {
					...current[mode],
					saving: false,
					error: firstErrorMessage(error, t('settings.modelServices.saveError')),
				},
			}));
		}
	};

	return (
		<SettingsPageShell>
			<SettingsPageHeader
				title={t('settings.modelServices.speechTranscriberName')}
				description={t('settings.modelServices.speechTranscriberDescription')}
			/>

			<SettingsSection title={t('settings.modelServices.configuration')}>
				<div className="grid gap-2">
					{SPEECH_MODE_CONFIGS.map((config) => {
						const modeState = speechStates[config.mode];
						const group = modeState.modelGroups.find(
							(item) => item.provider.id === modeState.providerId
						);
						const provider = group?.provider;
						const model = group?.models.find((item) => item.id === modeState.modelId);
						const summary =
							provider && model
								? `${getProviderCatalogItem(provider.id).name} - ${model.name || model.id}`
								: t(config.descriptionKey);

						return (
							<ModelProviderConfiguration
								key={config.mode}
								configState={modeState}
								triggerTitle={t(config.titleKey)}
								triggerDescription={summary}
								description={t(config.modelDescriptionKey)}
								idPrefix={`transcribe-${config.mode}`}
								showInlineError
								onChange={(nextProviderId, nextModelId) =>
									void handleSpeechChange(config.mode, nextProviderId, nextModelId)
								}
							/>
						);
					})}
				</div>
			</SettingsSection>

			<SettingsSection
				title={t('settings.modelServices.test')}
				description={t('settings.modelServices.testTranscribeDescription')}
			>
				<TranscribeTest />
			</SettingsSection>
		</SettingsPageShell>
	);
};

export default TranscribePage;
