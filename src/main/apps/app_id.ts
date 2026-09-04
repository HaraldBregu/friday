export function isExtensionId(value: unknown): value is string {
	return typeof value === 'string' && /^[a-z0-9][a-z0-9_-]*$/i.test(value);
}
