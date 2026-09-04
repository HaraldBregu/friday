export function makeId(): string {
	return globalThis.crypto.randomUUID();
}
