export function canLeaveInstructions(page: string, dirty: boolean): boolean {
	return (
		page !== 'instructions' ||
		!dirty ||
		window.confirm('Discard unsaved agent instruction changes?')
	);
}
