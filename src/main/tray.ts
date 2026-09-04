import { Tray as ElectronTray, Menu, nativeImage } from 'electron';
import path from 'node:path';

import { loadTranslations } from './i18n';
import type { App } from './apps/app_index';
import { resourceRoot } from './shared/resource_root';

interface TrayManagerCallbacks {
	onToggleApp: () => void;
	onQuit: () => void;
	isAppVisible: () => boolean;
	getApps: () => App[];
	onOpenApp: (app: App) => void;
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
			path.join(resourceRoot(), 'resources/icons/png/32x32.png')
		);

		this.tray = new ElectronTray(icon.resize({ width: 16, height: 16 }));
		this.tray.setToolTip('Kucedr');

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
		const apps = this.callbacks.getApps();
		const appItems: Array<Electron.MenuItemConstructorOptions> = apps.length
			? apps.map((app) => ({
					label: app.title,
					click: (): void => this.callbacks.onOpenApp(app),
				}))
			: [{ label: m.noApps || 'No apps', enabled: false }];

		this.contextMenu = Menu.buildFromTemplate([
			{
				label: isVisible ? m.hideKucedr || 'Hide Kucedr' : m.showKucedr || 'Show Kucedr',
				click: () => this.callbacks.onToggleApp(),
			},
			{
				label: m.apps || 'Apps',
				submenu: appItems,
			},
			{ type: 'separator' },
			{
				label: m.quit,
				click: () => this.callbacks.onQuit(),
			},
		]);
	}
}
