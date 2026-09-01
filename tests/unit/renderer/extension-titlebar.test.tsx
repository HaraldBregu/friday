import { render } from '@testing-library/react';
import { ExtensionTitleBar } from '../../../src/renderer/src/components/app/titlebar/ExtensionTitleBar';

jest.mock(
	'../../../src/renderer/src/components/app/titlebar/hooks/useExtensionWindowState',
	() => ({ useExtensionWindowState: jest.fn(() => false) })
);

it('continues the extension sidebar surface through the titlebar', () => {
	const { container } = render(<ExtensionTitleBar title="Workspace" sidebarWidth={240} />);
	const surface = container.querySelector('[data-slot="extension-titlebar-sidebar"]');

	expect(surface).toHaveClass('bg-sidebar', 'border-sidebar-border/50');
	expect(surface).toHaveStyle({ width: '240px' });
});
