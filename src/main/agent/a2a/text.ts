import type { Part } from '@a2a-js/sdk';

export function a2aText(parts: Part[]): string {
	return parts
		.map((part) =>
			part.content?.$case === 'text'
				? part.content.value
				: part.content?.$case === 'data'
					? JSON.stringify(part.content.value)
					: part.content?.$case === 'url'
						? part.content.value
						: ''
		)
		.filter(Boolean)
		.join('\n');
}
