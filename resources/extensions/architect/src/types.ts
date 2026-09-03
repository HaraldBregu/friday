import type { CatalogModel, ImageSource } from '@kucedr/sdk';

export type CropRatio = 'original' | '1:1' | '4:3' | '3:2' | '16:9';

export interface GenerationBrief {
	description: string;
	room: string;
	style: string;
	materials: string;
	lighting: string;
	ratio: Exclude<CropRatio, 'original'>;
}

export interface CropSettings {
	ratio: CropRatio;
	zoom: number;
	x: number;
	y: number;
}

export interface ArchitectVersion extends ImageSource {
	id: string;
	label: string;
	prompt: string;
	createdAt: number;
	url: string;
}

export interface StudioController {
	connected: boolean;
	brief: GenerationBrief;
	crop: CropSettings;
	cropMode: boolean;
	current?: ArchitectVersion;
	currentId?: string;
	versions: ArchitectVersion[];
	busy?: string;
	message: string;
	modelLabel: string;
	catalog: CatalogModel[];
	updateBrief: (field: keyof GenerationBrief, value: string) => void;
	updateCrop: (field: keyof CropSettings, value: string | number) => void;
	generate: () => Promise<void>;
	importFile: (file: File) => Promise<void>;
	revise: (instruction: string) => Promise<void>;
	applyCrop: () => Promise<void>;
	setCropMode: (active: boolean) => void;
	selectVersion: (id: string) => void;
	download: () => void;
	reset: () => void;
}
