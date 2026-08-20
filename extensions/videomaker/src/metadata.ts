export async function readMediaDuration(file: File, src: string): Promise<number> {
	if (file.type.startsWith('image/')) return 5;
	const element = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video');
	element.preload = 'metadata';
	element.src = src;
	return new Promise((resolve) => {
		element.onloadedmetadata = () =>
			resolve(Number.isFinite(element.duration) ? Math.max(0.5, element.duration) : 5);
		element.onerror = () => resolve(5);
	});
}
