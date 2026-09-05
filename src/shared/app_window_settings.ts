export type AppWindowSettings = {
	width?: number;
	height?: number;
	minWidth?: number;
	minHeight?: number;
	resizable?: boolean;
	maximizable?: boolean;
};

export type ResolvedAppWindowSettings = Required<AppWindowSettings>;

export const APP_WINDOW_DEFAULTS: Readonly<ResolvedAppWindowSettings> = {
	width: 820,
	height: 640,
	minWidth: 620,
	minHeight: 480,
	resizable: true,
	maximizable: true,
};
