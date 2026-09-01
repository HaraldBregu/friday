import { isExtensionTitlebarOptions } from '../../../../src/shared/titlebar_validate';

it('accepts a complete extension titlebar snapshot and reset', () => {
	expect(
		isExtensionTitlebarOptions({
			title: 'Workspace',
			leftButtons: [
				{
					id: 'toggle-sidebar',
					label: 'Collapse sidebar',
					icon: 'panel-left',
					pressed: true,
				},
			],
			rightButtons: [{ id: 'settings', label: 'Settings', icon: 'settings' }],
			sidebarWidth: 240,
		})
	).toBe(true);
	expect(isExtensionTitlebarOptions(null)).toBe(true);
});

it.each([
	{ title: '' },
	{ sidebarWidth: -1 },
	{ sidebarWidth: Number.NaN },
	{ leftButtons: [{ id: 'toggle', label: 'Toggle', icon: 'custom' }] },
	{
		leftButtons: [
			{ id: 'duplicate', label: 'First', icon: 'panel-left' },
			{ id: 'duplicate', label: 'Second', icon: 'panel-right' },
		],
	},
	{ rightButtons: new Array(7).fill({ id: 'same', label: 'Same', icon: 'settings' }) },
])('rejects malformed titlebar options: %p', (options) => {
	expect(isExtensionTitlebarOptions(options)).toBe(false);
});
