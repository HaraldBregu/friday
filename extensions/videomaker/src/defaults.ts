import type { CanvasPreset, Project } from './types';

export const canvasPresets: CanvasPreset[] = [
	{ label: 'Landscape · 16:9', width: 1920, height: 1080 },
	{ label: 'Square · 1:1', width: 1080, height: 1080 },
	{ label: 'Portrait · 9:16', width: 1080, height: 1920 },
	{ label: 'Social · 4:5', width: 1080, height: 1350 },
];

export const defaultProject: Project = {
	name: 'Untitled video',
	width: 1920,
	height: 1080,
	fps: 30,
	background: '#111820',
	clips: [
		{
			id: 'starter-title',
			kind: 'text',
			name: 'Opening title',
			src: '',
			assetPath: null,
			mime: null,
			start: 0,
			duration: 2.5,
			sourceDuration: null,
			text: 'Tell your story',
			color: '#f8fafc',
			fontSize: 112,
			volume: 1,
			muted: false,
			fit: 'cover',
		},
		{
			id: 'starter-subtitle',
			kind: 'text',
			name: 'Closing title',
			src: '',
			assetPath: null,
			mime: null,
			start: 2.5,
			duration: 3.5,
			sourceDuration: null,
			text: 'Shape it. Preview it. Export it.',
			color: '#a7f3d0',
			fontSize: 64,
			volume: 1,
			muted: false,
			fit: 'cover',
		},
	],
};
