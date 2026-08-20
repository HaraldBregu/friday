export type ClipKind = 'video' | 'image' | 'audio' | 'text';

export type ClipFit = 'cover' | 'contain';

export interface Clip {
	id: string;
	kind: ClipKind;
	name: string;
	src: string;
	assetPath: string | null;
	mime: string | null;
	start: number;
	duration: number;
	sourceDuration: number | null;
	text: string;
	color: string;
	fontSize: number;
	volume: number;
	muted: boolean;
	fit: ClipFit;
}

export interface Project {
	name: string;
	width: number;
	height: number;
	fps: number;
	background: string;
	clips: Clip[];
}

export interface CanvasPreset {
	label: string;
	width: number;
	height: number;
}
