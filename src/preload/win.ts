import { typedInvokeUnwrap, typedSend, typedOn } from '../shared/ipc_types';
import { WindowChannels } from '../shared/ipc_channels_definitions';
import type { WindowApi } from './index.d';

export const win: WindowApi = {
	minimize: (): void => {
		typedSend(WindowChannels.minimize);
	},
	maximize: (): void => {
		typedSend(WindowChannels.maximize);
	},
	close: (): void => {
		typedSend(WindowChannels.close);
	},
	popupMenu: (): void => {
		typedSend(WindowChannels.popupMenu);
	},
	showContextMenu: (items) => {
		return typedInvokeUnwrap(WindowChannels.showContextMenu, items);
	},
	isMaximized: (): Promise<boolean> => {
		return typedInvokeUnwrap(WindowChannels.isMaximized);
	},
	onMaximizeChange: (callback: (isMaximized: boolean) => void): (() => void) => {
		return typedOn(WindowChannels.maximizeChange, callback);
	},
	isFullScreen: (): Promise<boolean> => {
		return typedInvokeUnwrap(WindowChannels.isFullScreen);
	},
	onFullScreenChange: (callback: (isFullScreen: boolean) => void): (() => void) => {
		return typedOn(WindowChannels.fullScreenChange, callback);
	},
	setTitlebarSidebarWidth: (width: number | null): void => {
		typedSend(WindowChannels.titlebarSidebarWidthSet, width);
	},
	onTitlebarSidebarWidthChanged: (callback: (width: number | null) => void): (() => void) => {
		return typedOn(WindowChannels.titlebarSidebarWidthChanged, callback);
	},
} satisfies WindowApi;
