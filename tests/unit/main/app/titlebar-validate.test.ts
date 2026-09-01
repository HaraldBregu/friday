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
					expanded: true,
				},
			],
			rightButtons: [{ id: 'settings', label: 'Settings', icon: 'settings' }],
			sidebarOpen: true,
			sidebarWidth: 240,
		})
	).toBe(true);
	expect(isExtensionTitlebarOptions(null)).toBe(true);
});

it.each([
	{ title: '' },
	{ sidebarWidth: -1 },
	{ sidebarWidth: Number.NaN },
	{ sidebarOpen: 'yes' },
	{ leftButtons: [{ id: 'toggle', label: 'Toggle', icon: 'custom' }] },
	{ leftButtons: [{ id: 'toggle', label: 'Toggle', icon: 'panel-left', expanded: 'yes' }] },
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
