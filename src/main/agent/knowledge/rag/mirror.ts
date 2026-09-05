import { uploadRagMirror } from './upload';
import { discardRagMirror } from './discard';
import type { RagMirror } from './types';

export function createRagMirror(): RagMirror {
	const apiKey = process.env.PINECONE_API_KEY?.trim() ?? '';
	if (!apiKey) throw new Error('PINECONE_API_KEY is not configured.');
	return {
		upload: uploadRagMirror.bind(undefined, apiKey),
		discard: discardRagMirror.bind(undefined, apiKey),
	};
}
