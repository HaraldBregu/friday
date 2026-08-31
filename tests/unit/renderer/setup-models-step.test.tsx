import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { SetupModelsStep } from '../../../src/renderer/src/pages/setup/components/SetupModelsStep';
import type { ModelServiceStateMap } from '../../../src/renderer/src/pages/setup/setupTypes';

jest.mock('@pages/settings/components/model-configuration', () => ({
	ModelProviderConfiguration: ({
		idPrefix,
		grouped,
		showFieldLabel,
		triggerTitle,
	}: {
		idPrefix: string;
		grouped?: boolean;
		showFieldLabel?: boolean;
		triggerTitle: React.ReactNode;
	}) => (
		<div
			data-testid={idPrefix}
			data-grouped={grouped ? 'true' : 'false'}
			data-show-field-label={String(showFieldLabel)}
		>
			{triggerTitle}
		</div>
	),
}));

jest.mock('../../../src/renderer/src/pages/setup/components/SetupSearch', () => ({
	SetupSearch: () => <div data-testid="setup-search">SetupSearch Engine</div>,
}));

jest.mock('../../../src/renderer/src/pages/settings/pages/assistant/conversation', () => ({
	__esModule: true,
	default: ({
		selectDefaultModel,
		showFieldLabel,
	}: {
		selectDefaultModel?: boolean;
		showFieldLabel?: boolean;
	}) => (
		<div
			data-default-model={String(selectDefaultModel)}
			data-show-field-label={String(showFieldLabel)}
			data-testid="setup-realtime"
		>
			Realtime conversation
		</div>
	),
}));

const EMPTY_SERVICE = { providerId: '', modelId: '', modelGroups: [] };
const SERVICE_STATES: ModelServiceStateMap = {
	assistant: EMPTY_SERVICE,
	health: EMPTY_SERVICE,
	tasks: EMPTY_SERVICE,
	voice: EMPTY_SERVICE,
	transcription: EMPTY_SERVICE,
	image: EMPTY_SERVICE,
	video: EMPTY_SERVICE,
	audio: EMPTY_SERVICE,
};

it('groups model services in one card', () => {
	render(
		<SetupModelsStep
			serviceStates={SERVICE_STATES}
			loadingModels={false}
			savingConfig={false}
			onServiceChange={jest.fn()}
		/>
	);

	const assistantGroup = screen.getByRole('region', { name: 'Model providers' });
	const serviceIds = ['assistant', 'voice', 'transcription', 'image', 'audio', 'video'];
	for (const id of serviceIds) {
		expect(within(assistantGroup).getByTestId(`setup-${id}`)).toHaveAttribute(
			'data-grouped',
			'true'
		);
		expect(within(assistantGroup).getByTestId(`setup-${id}`)).toHaveAttribute(
			'data-show-field-label',
			'false'
		);
	}
	expect(within(assistantGroup).getByTestId('setup-assistant')).toHaveTextContent('Model');
	expect(within(assistantGroup).getByTestId('setup-realtime')).toHaveAttribute(
		'data-default-model',
		'false'
	);
	expect(within(assistantGroup).getByTestId('setup-realtime')).toHaveAttribute(
		'data-show-field-label',
		'false'
	);
	expect(
		within(assistantGroup)
			.getAllByTestId(/^setup-/)
			.map((element) => element.dataset.testid)
	).toEqual([
		'setup-assistant',
		'setup-realtime',
		...serviceIds.slice(1).map((id) => `setup-${id}`),
		'setup-search',
	]);
	expect(screen.queryByTestId('setup-health')).not.toBeInTheDocument();
	expect(screen.queryByTestId('setup-tasks')).not.toBeInTheDocument();
});
