import React from 'react';
import ProvidersPage, {
	type ProviderSetupSection,
} from '../../settings/pages/providers/Page';
import { StepHeader } from './StepHeader';

type ProviderStepProps = {
	readonly section: ProviderSetupSection;
	readonly title: string;
	readonly description: string;
};

export function ProviderStep({ section, title, description }: ProviderStepProps): React.JSX.Element {

	return (
		<div className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 py-8 sm:px-6">
			<StepHeader title={title} description={description} />
			<div className="mt-6">
				<ProvidersPage embedded section={section} />
			</div>
		</div>
	);
}
