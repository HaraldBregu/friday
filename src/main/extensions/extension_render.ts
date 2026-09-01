import type { BrowserWindow, WebContents, WebContentsView } from 'electron';
import { setupPdfContextMenu } from '../pdf';
import type { WindowFactory } from '../window_factory';
import { attachWindowHandlers } from '../window_events';
import { getPlatformTranslucencyOptions } from '../translucency';

interface ExtensionWindow {
	window: BrowserWindow;
	ready: boolean;
}

const windows = new Map<string, ExtensionWindow>();
export const openExtensionWindows: ReadonlyMap<string, { readonly window: BrowserWindow }> =
	windows;
const titleBarHeight = 48;

export function render(
	windowFactory: WindowFactory,
	file: string,
	title: string,
	extensionId: string
): BrowserWindow {
	const existing = windows.get(extensionId);
	if (existing && !existing.window.isDestroyed()) {
		if (existing.window.isMinimized()) existing.window.restore();
		if (existing.ready && !existing.window.isVisible()) existing.window.show();
		existing.window.focus();
		return existing.window;
	}

	const isMac = process.platform === 'darwin';
	const win = windowFactory.create(
		{
			width: 820,
			height: 640,
			minWidth: 620,
			minHeight: 480,
			resizable: true,
			frame: false,
			transparent: true,
			...(isMac && {
				titleBarStyle: 'hidden',
				trafficLightPosition: { x: 16, y: 17 },
			}),
			...getPlatformTranslucencyOptions(),
			title,
			autoHideMenuBar: true,
			backgroundColor: '#00000000',
		},
		{ html: 'extension.html', hash: `extension/${encodeURIComponent(title)}` }
	);

	const extensionWindow: ExtensionWindow = { window: win, ready: false };
	windows.set(extensionId, extensionWindow);
	win.setMenuBarVisibility(false);
	let shellFailed = false;
	let extensionView: WebContentsView | undefined;
	let extensionContents: WebContents | undefined;
	let shellReady = false;
	let extensionReady = false;
	let childClosing = false;
	let hostCloseAllowed = false;
	const showWhenReady = (): void => {
		if (!shellReady || !extensionReady || win.isDestroyed()) return;
		extensionWindow.ready = true;
		win.show();
	};
	const resizeView = (): void => {
		if (!extensionView || win.isDestroyed()) return;
		const { width, height } = win.getContentBounds();
		extensionView.setBounds({
			x: 0,
			y: titleBarHeight,
			width,
			height: Math.max(0, height - titleBarHeight),
		});
	};
	const discardFailedShell = (): void => {
		if (shellFailed) return;
		shellFailed = true;
		if (windows.get(extensionId) === extensionWindow) windows.delete(extensionId);
		if (!win.isDestroyed()) win.destroy();
	};

	win.once('ready-to-show', () => {
		shellReady = true;
		showWhenReady();
	});
	win.webContents.once('did-finish-load', () => {
		if (win.isDestroyed()) return;
		const { view, load } = windowFactory.createView(file, extensionId);
		extensionView = view;
		extensionContents = view.webContents;
		const viewContents = extensionContents;

		view.setVisible(false);
		win.contentView.addChildView(view);
		resizeView();
		setupPdfContextMenu(win, viewContents);
		attachWindowHandlers(win, [win.webContents, viewContents]);
		viewContents.on('will-prevent-unload', () => {
			childClosing = false;
		});
		viewContents.once('destroyed', () => {
			childClosing = false;
			if (!win.isDestroyed()) {
				hostCloseAllowed = true;
				win.close();
			}
		});
		viewContents.once('render-process-gone', () => {
			if (!win.isDestroyed()) {
				hostCloseAllowed = true;
				win.close();
			}
		});
		void load()
			.then(() => {
				if (win.isDestroyed() || viewContents.isDestroyed()) return;
				view.setVisible(true);
				extensionReady = true;
				showWhenReady();
			})
			.catch(() => {
				if (!win.isDestroyed()) {
					hostCloseAllowed = true;
					win.close();
				}
			});
	});
	win.webContents.once('render-process-gone', discardFailedShell);
	win.webContents.once('did-fail-load', (_event, errorCode) => {
		if (errorCode !== -3) discardFailedShell();
	});
	win.webContents.on('page-title-updated', (event) => event.preventDefault());
	win.setTitle(title);
	win.on('resize', resizeView);
	win.on('close', (event) => {
		if (!extensionContents || hostCloseAllowed || extensionContents.isDestroyed()) return;
		event.preventDefault();
		if (childClosing) return;
		childClosing = true;
		extensionContents.close({ waitForBeforeUnload: true });
	});
	win.on('closed', () => {
		if (windows.get(extensionId) === extensionWindow) windows.delete(extensionId);
		if (extensionContents && !extensionContents.isDestroyed()) extensionContents.close();
	});
	return win;
}
