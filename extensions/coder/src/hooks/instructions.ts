import { useCallback, useEffect, useRef, useState } from 'react';
import { coder, type CoderProjectInstructions } from '@friday/sdk';

export function useProjectInstructions(projectId: string | undefined) {
	const loadSequenceRef = useRef(0);
	const [instructions, setInstructions] = useState<CoderProjectInstructions>();
	const [content, setContent] = useState('');
	const [loading, setLoading] = useState(Boolean(projectId));
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		const sequence = ++loadSequenceRef.current;
		setInstructions(undefined);
		setContent('');
		setError('');
		setSaving(false);
		if (!projectId) {
			setLoading(false);
			return;
		}
		setLoading(true);
		void coder
			.getProjectInstructions(projectId)
			.then((next) => {
				if (sequence !== loadSequenceRef.current) return;
				setInstructions(next);
				setContent(next.content);
			})
			.catch((reason) => {
				if (sequence !== loadSequenceRef.current) return;
				setError(
					reason instanceof Error ? reason.message : 'Unable to load project instructions.'
				);
			})
			.finally(() => {
				if (sequence === loadSequenceRef.current) setLoading(false);
			});
	}, [projectId]);

	const dirty = Boolean(instructions && content !== instructions.content);
	const canSave = Boolean(
		projectId &&
			instructions?.editable &&
			!loading &&
			!saving &&
			(dirty || !instructions.exists)
	);

	const save = useCallback(async (): Promise<void> => {
		if (!projectId || !instructions || !canSave) return;
		const submittedContent = content;
		setSaving(true);
		setError('');
		try {
			const next = await coder.saveProjectInstructions(projectId, {
				content: submittedContent,
				expectedRevision: instructions.revision,
			});
			setInstructions(next);
			setContent((current) => (current === submittedContent ? next.content : current));
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Unable to save project instructions.');
		} finally {
			setSaving(false);
		}
	}, [canSave, content, instructions, projectId]);

	return {
		instructions,
		content,
		loading,
		saving,
		error,
		dirty,
		canSave,
		save,
		setContent,
	};
}
