const APP_TOOL_TYPES = new Set(['list_apps', 'open_apps', 'close_apps']);

export function isAppToolType(type: string): boolean {
	return APP_TOOL_TYPES.has(type.toLowerCase());
}
