import { Tray as ElectronTray, Menu, nativeImage } from 'electron';
import path from 'node:path';

import { loadTranslations } from './i18n';
import type { Extension } from './extensions/extension_index';
import { resourceRoot } from './shared/resource_root';

interface TrayManagerCallbacks {
	onToggleApp: () => void;
	onQuit: () => void;
	isAppVisible: () => boolean;
	getExtensions: () => Extension[];
	onOpenExtension: (extension: Extension) => void;
}

export class Tray {
	private tray: ElectronTray | null = null;
	private contextMenu: Menu | null = null;
	private currentLanguage = 'en';
	private callbacks: TrayManagerCallbacks;

	constructor(callbacks: TrayManagerCallbacks) {
		this.callbacks = callbacks;
	}

	create(): void {
		const icon = nativeImage.createFromPath(
			path.join(resourceRoot(), 'resources/icons/icon.png')
		);

		this.tray = new ElectronTray(icon.resize({ width: 16, height: 16 }));
		this.tray.setToolTip('Friday');

		this.tray.on('click', () => {
			this.callbacks.onToggleApp();
		});

		this.tray.on('right-click', () => {
			this.buildContextMenu();
			if (this.contextMenu) {
				this.tray?.popUpContextMenu(this.contextMenu);
			}
		});

		this.buildContextMenu();
	}

	destroy(): void {
		if (this.tray) {
			this.tray.destroy();
			this.tray = null;
			this.contextMenu = null;
		}
	}

	isCreated(): boolean {
		return this.tray !== null;
	}

	updateLanguage(lng: string): void {
		this.currentLanguage = lng;
		this.buildContextMenu();
	}

	/**
	 * Rebuild the context menu (useful for updating dynamic labels)
	 */
	updateContextMenu(): void {
		this.buildContextMenu();
	}

	private buildContextMenu(): void {
		if (!this.tray) {
			this.contextMenu = null;
			return;
		}
		const m = loadTranslations(this.currentLanguage, 'tray');
		const isVisible = this.callbacks.isAppVisible();
		const extensions = this.callbacks.getExtensions();
		const extensionItems: Array<Electron.MenuItemConstructorOptions> = extensions.length
			? extensions.map((extension) => ({
					label: extension.title,
					click: (): void => this.callbacks.onOpenExtension(extension),
				}))
			: [{ label: m.noExtensions || 'No extensions', enabled: false }];

		this.contextMenu = Menu.buildFromTemplate([
			{
				label: isVisible ? m.hideFriday || 'Hide Friday' : m.showFriday || 'Show Friday',
				click: () => this.callbacks.onToggleApp(),
			},
			{
				label: m.extensions || 'Extensions',
				submenu: extensionItems,
			},
			{ type: 'separator' },
			{
				label: m.quit,
				click: () => this.callbacks.onQuit(),
			},
		]);
	}
}
