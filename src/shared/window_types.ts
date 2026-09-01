export type ContextMenuRole =
	| 'undo'
	| 'redo'
	| 'cut'
	| 'copy'
	| 'paste'
	| 'pasteAndMatchStyle'
	| 'delete'
	| 'selectAll';

export type ContextMenuDescriptor =
	| { type: 'separator' }
	| {
			type: 'role';
			role: ContextMenuRole;
			label?: string;
			enabled?: boolean;
	  }
	| {
			type?: 'item';
			id: string;
			label: string;
			accelerator?: string;
			enabled?: boolean;
	  };

export const EXTENSION_TITLEBAR_BUTTON_ICONS = [
	'panel-left',
	'panel-right',
	'plus',
	'settings',
	'search',
	'refresh',
	'more-horizontal',
] as const;

export type ExtensionTitlebarButtonIcon =
	(typeof EXTENSION_TITLEBAR_BUTTON_ICONS)[number];

export interface ExtensionTitlebarButton {
	id: string;
	label: string;
	icon: ExtensionTitlebarButtonIcon;
	disabled?: boolean;
	pressed?: boolean;
}

export interface ExtensionTitlebarOptions {
	title?: string;
	leftButtons?: ExtensionTitlebarButton[];
	rightButtons?: ExtensionTitlebarButton[];
	sidebarWidth?: number | null;
}
