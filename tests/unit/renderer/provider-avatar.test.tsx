import { render } from '@testing-library/react';
import { ProviderAvatar } from '../../../src/renderer/src/components/provider-avatar';

it.each(['brave', 'tavily', 'reka'])('enlarges the %s provider icon', (providerId) => {
	const { container } = render(
		<ProviderAvatar
			providerId={providerId}
			name={providerId}
			iconDarkUrl="/dark.svg"
			iconLightUrl="/light.svg"
		/>
	);

	expect(container.firstElementChild).toHaveClass('p-0');
	expect(container.firstElementChild).not.toHaveClass('p-1');
});
