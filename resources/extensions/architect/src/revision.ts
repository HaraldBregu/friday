export function buildRevisionPrompt(instruction: string): string {
	return [
		`Using the provided architectural image, apply only this design revision: ${instruction.trim()}.`,
		'Preserve the room geometry, camera position, perspective, windows, doors, structural elements, lighting logic, scale, and every unspecified object.',
		'Return one finished photorealistic interior visualization without text, labels, logos, or watermarks.',
	].join(' ');
}
