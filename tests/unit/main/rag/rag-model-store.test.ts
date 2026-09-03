const getAgentProviderId = jest.fn();
const setAgentProviderId = jest.fn();
const getAgentModelId = jest.fn();
const setAgentModelId = jest.fn();
const getAgentMediaModel = jest.fn();
const setAgentMediaModel = jest.fn();
const getRagConfiguration = jest.fn();
const saveRagConfiguration = jest.fn();

jest.mock('../../../../src/main/agent/agent_store', () => ({
	getProviderId: getAgentProviderId,
	setProviderId: setAgentProviderId,
	getModelId: getAgentModelId,
	setModelId: setAgentModelId,
	getMediaModel: getAgentMediaModel,
	setMediaModel: setAgentMediaModel,
}));
jest.mock('../../../../src/main/providers/providers_index', () => ({
	getModelProvidersState: () => [],
	setModelProvidersState: jest.fn(),
}));
jest.mock('../../../../src/main/agent/knowledge/rag/rag_store', () => ({
	getRagConfiguration,
	saveRagConfiguration,
}));

import {
	getModelId,
	getOptions,
	getProviderId,
	resolveOptions,
	setModelId,
	setOptions,
	setProviderId,
} from '../../../../src/main/models/selection';

const ragConfiguration = {
	indexName: 'kucedr',
	databaseProviderId: 'pinecone',
	databaseId: 'pinecone',
	embeddingProviderId: 'openai',
	embeddingModelId: 'text-embedding-3-small',
	folders: [],
	scheduleEnabled: false,
	cronExpression: '0 3 * * *',
};

beforeEach(() => {
	jest.clearAllMocks();
	let currentRagConfiguration = { ...ragConfiguration };
	const mediaModels = {
		image: { providerId: 'google', modelId: 'gemini-image', options: { imageSize: '1K' } },
		audio: {
			providerId: 'elevenlabs',
			modelId: 'eleven-music',
			options: { force_instrumental: true },
		},
		video: { providerId: 'google', modelId: 'veo-3.1', options: { durationSeconds: 8 } },
		voice: { providerId: 'openai', modelId: 'gpt-4o-mini-tts', options: { voice: 'cedar' } },
		realtimeVoice: {
			providerId: 'openai',
			modelId: 'gpt-realtime-2.1',
			options: { voice: 'marin' },
		},
		transcription: { providerId: 'deepgram', modelId: 'nova-3', options: {} },
	};
	getAgentProviderId.mockReturnValue('openai');
	getAgentModelId.mockReturnValue('gpt-5');
	getAgentMediaModel.mockImplementation((kind: keyof typeof mediaModels) => mediaModels[kind]);
	setAgentMediaModel.mockImplementation(
		(kind: keyof typeof mediaModels, settings: (typeof mediaModels)[keyof typeof mediaModels]) => {
			mediaModels[kind] = settings as never;
		}
	);
	getRagConfiguration.mockImplementation(() => currentRagConfiguration);
	saveRagConfiguration.mockImplementation((configuration) => {
		currentRagConfiguration = configuration;
		return configuration;
	});
});

it('reads and writes embedding selection through the RAG store', () => {
	expect(getProviderId('embedding')).toBe('openai');
	expect(getModelId('embedding')).toBe('text-embedding-3-small');

	setProviderId('embedding', 'voyage');
	setModelId('embedding', 'voyage-3');

	expect(saveRagConfiguration).toHaveBeenNthCalledWith(1, {
		...ragConfiguration,
		embeddingProviderId: 'voyage',
	});
	expect(saveRagConfiguration).toHaveBeenNthCalledWith(2, {
		...ragConfiguration,
		embeddingProviderId: 'voyage',
		embeddingModelId: 'voyage-3',
	});
});

it('reads and writes text selection through the agent store', () => {
	expect(getProviderId('text')).toBe('openai');
	expect(getModelId('text')).toBe('gpt-5');

	setModelId('text', 'gpt-5.1');

	expect(setAgentModelId).toHaveBeenCalledWith('gpt-5.1');
	expect(saveRagConfiguration).not.toHaveBeenCalled();
});

it('reads and writes media selections and options through the agent store', () => {
	expect(getProviderId('image')).toBe('google');
	expect(getModelId('sound')).toBe('eleven-music');
	expect(getOptions('video')).toEqual({ durationSeconds: 8 });

	setModelId('image', 'gemini-image-next');
	setOptions('sound', { force_instrumental: false });
	setProviderId('video', 'xai');

	expect(setAgentMediaModel).toHaveBeenNthCalledWith(1, 'image', {
		providerId: 'google',
		modelId: 'gemini-image-next',
		options: {},
	});
	expect(setAgentMediaModel).toHaveBeenNthCalledWith(2, 'audio', {
		providerId: 'elevenlabs',
		modelId: 'eleven-music',
		options: { force_instrumental: false },
	});
	expect(setAgentMediaModel).toHaveBeenNthCalledWith(3, 'video', {
		providerId: 'xai',
		modelId: 'veo-3.1',
		options: {},
	});
});

it('reads and writes voice selection and options through the agent store', () => {
	expect(getProviderId('voice')).toBe('openai');
	expect(getModelId('voice')).toBe('gpt-4o-mini-tts');
	expect(getOptions('voice')).toEqual({ voice: 'cedar' });
	setOptions('voice', { voice: 'marin', speed: 1.1 });

	expect(setAgentMediaModel).toHaveBeenCalledWith('voice', {
		providerId: 'openai',
		modelId: 'gpt-4o-mini-tts',
		options: { voice: 'marin', speed: 1.1 },
	});
});

it('reads and writes batch and realtime transcription through the agent store', () => {
	expect(getProviderId('transcribe')).toBe('deepgram');
	expect(getModelId('transcribe')).toBe('nova-3');
	expect(getProviderId('realtime')).toBe('deepgram');
	expect(getModelId('realtime')).toBe('nova-3');

	setModelId('transcribe', 'nova-4');
	setProviderId('realtime', 'openai');

	expect(setAgentMediaModel).toHaveBeenNthCalledWith(1, 'transcription', {
		providerId: 'deepgram',
		modelId: 'nova-4',
		options: {},
	});
	expect(setAgentMediaModel).toHaveBeenNthCalledWith(2, 'transcription', {
		providerId: 'openai',
		modelId: 'nova-4',
		options: {},
	});
});

it('reads and writes realtime voice selection and options independently', () => {
	expect(getProviderId('realtimeVoice')).toBe('openai');
	expect(getModelId('realtimeVoice')).toBe('gpt-realtime-2.1');
	expect(getOptions('realtimeVoice')).toEqual({ voice: 'marin' });

	setModelId('realtimeVoice', 'gpt-realtime-2.1-mini');
	setOptions('realtimeVoice', { voice: 'cedar' });

	expect(setAgentMediaModel).toHaveBeenNthCalledWith(1, 'realtimeVoice', {
		providerId: 'openai',
		modelId: 'gpt-realtime-2.1-mini',
		options: {},
	});
	expect(setAgentMediaModel).toHaveBeenNthCalledWith(2, 'realtimeVoice', {
		providerId: 'openai',
		modelId: 'gpt-realtime-2.1-mini',
		options: { voice: 'cedar' },
	});
});

it('merges stored media defaults only for their selected model', () => {
	expect(resolveOptions('image', 'google', 'gemini-image', { imageSize: '2K' })).toEqual({
		imageSize: '2K',
	});
	expect(resolveOptions('image', 'xai', 'grok-imagine-image', { n: 2 })).toEqual({ n: 2 });
});

it('merges stored voice defaults with request overrides', () => {
	expect(resolveOptions('voice', 'openai', 'gpt-4o-mini-tts', { speed: 1.25 })).toEqual({
		voice: 'cedar',
		speed: 1.25,
	});
});
