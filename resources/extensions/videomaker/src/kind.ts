import type { ClipKind } from './types';

export function getFileKind(file: File): ClipKind | null {
	if (file.type.startsWith('video/')) return 'video';
	if (file.type.startsWith('image/')) return 'image';
	if (file.type.startsWith('audio/')) return 'audio';
	return null;
}
