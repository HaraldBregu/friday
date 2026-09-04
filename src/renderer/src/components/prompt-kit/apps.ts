const EXTENSION_TOOL_TYPES = new Set(['list_extensions', 'open_extensions', 'close_extensions']);

export function isExtensionToolType(type: string): boolean {
	return EXTENSION_TOOL_TYPES.has(type.toLowerCase());
}
