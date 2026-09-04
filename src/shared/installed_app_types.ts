export type ExtensionMetadata = {
	version: string;
	category: string;
	entry: string;
	[key: string]: unknown;
};

export type ExtensionManifest = {
	title: string;
	description: string;
	metadata: ExtensionMetadata;
};

export type Extension = ExtensionManifest & {
	id: string;
};

export interface ExtensionImportSkipped {
	name: string;
	sourcePath: string;
	reason: string;
}

export interface ExtensionImportResult {
	imported: Extension[];
	skipped: ExtensionImportSkipped[];
}
