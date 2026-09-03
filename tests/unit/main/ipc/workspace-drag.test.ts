import { workspaceMoveError } from '../../../../resources/extensions/workspace/src/lib/drop';
import { rebaseWorkspacePath } from '../../../../resources/extensions/workspace/src/lib/rebase';

describe('workspace tree drag and drop', () => {
	const file = { name: 'note.md', path: 'source/note.md', type: 'file' } as const;
	const folder = {
		name: 'source',
		path: 'source',
		type: 'directory',
		children: [file],
	} as const;

	it('accepts files and folders in other folders or at the workspace root', () => {
		expect(workspaceMoveError(file, 'destination', [])).toBe('');
		expect(workspaceMoveError(folder, 'destination', [])).toBe('');
		expect(workspaceMoveError(file, '', [])).toBe('');
	});

	it('rejects same-parent, descendant, and name-collision targets', () => {
		expect(workspaceMoveError(file, 'source', [])).toContain('already in this folder');
		expect(workspaceMoveError(folder, 'source/child', [])).toContain('cannot be moved into itself');
		expect(
			workspaceMoveError(file, 'destination', [
				{ name: 'note.md', path: 'destination/note.md', type: 'file' },
			])
		).toContain('already exists');
	});

	it('rebases selected and expanded descendant paths after a folder move', () => {
		expect(rebaseWorkspacePath('source', 'source', 'destination/source')).toBe(
			'destination/source'
		);
		expect(rebaseWorkspacePath('source/child/note.md', 'source', 'destination/source')).toBe(
			'destination/source/child/note.md'
		);
	});
});
