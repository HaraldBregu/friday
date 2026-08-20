export function downloadVideo(blob: Blob, projectName: string): void {
	const name = projectName.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '');
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = `${name || 'video'}.mp4`;
	anchor.click();
	window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
