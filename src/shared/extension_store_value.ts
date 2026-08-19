import type { ExtensionStoreValue } from './extension_store_types';

interface ValueFrame {
	value?: unknown;
	exit?: object;
}

export function isExtensionStoreValue(value: unknown): value is ExtensionStoreValue {
	const ancestors = new Set<object>();
	const pending: ValueFrame[] = [{ value }];

	while (pending.length > 0) {
		const frame = pending.pop() as ValueFrame;
		if (frame.exit) {
			ancestors.delete(frame.exit);
			continue;
		}

		const input = frame.value;
		if (input === null || typeof input === 'string' || typeof input === 'boolean') continue;
		if (typeof input === 'number') {
			if (Number.isFinite(input)) continue;
			return false;
		}
		if (typeof input !== 'object' || ancestors.has(input)) return false;

		const keys = Object.keys(input);
		if (Object.getOwnPropertySymbols(input).length > 0) return false;
		if (Array.isArray(input)) {
			if (keys.length !== input.length || keys.some((key, index) => key !== String(index))) {
				return false;
			}
		} else {
			const prototype = Object.getPrototypeOf(input);
			if (prototype !== Object.prototype && prototype !== null) return false;
			if (Object.getOwnPropertyNames(input).length !== keys.length) return false;
		}

		ancestors.add(input);
		pending.push({ exit: input });
		for (let index = keys.length - 1; index >= 0; index -= 1) {
			const descriptor = Object.getOwnPropertyDescriptor(input, keys[index]);
			if (!descriptor?.enumerable || !('value' in descriptor)) return false;
			pending.push({ value: descriptor.value });
		}
	}

	return true;
}
