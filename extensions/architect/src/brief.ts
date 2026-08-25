import type { GenerationBrief } from './types';

export function buildBriefPrompt(brief: GenerationBrief): string {
	return [
		`Create a finished, photorealistic architectural interior visualization of a ${brief.room}.`,
		`Design brief: ${brief.description.trim()}.`,
		`Design language: ${brief.style}. Materials: ${brief.materials}. Lighting: ${brief.lighting}.`,
		`Compose for a ${brief.ratio} frame with an eye-level architectural camera, believable wide-angle perspective, coherent circulation, buildable proportions, realistic scale, physically plausible materials, and editorial archviz detail.`,
		'No people, labels, floor-plan overlays, text, logos, or watermarks.',
	].join(' ');
}
