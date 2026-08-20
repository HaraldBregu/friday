import type { SpeechSynthesisRequest, SpeechSynthesisResult } from './speech_types';
import type {
	RealtimeVoiceEvent,
	RealtimeVoiceSession,
	RealtimeVoiceSetup,
	RealtimeVoiceSetupRequest,
	RealtimeVoiceStartRequest,
} from './realtime_voice';
import type {
	SttModelSelection,
	SttRealtimeEvent,
	SttRealtimeSession,
	SttRealtimeStartRequest,
	SttSelectionMode,
	SttTranscriptionRequest,
	SttTranscriptionResult,
} from './stt_transcription';
import type { PublicProvider, StoredProvider } from './provider_types';
import type { ProviderModel } from './model_types';
import type { EmbeddingRequest, EmbeddingResult } from './embedding_types';
import type { ImageRequest, ImageResult } from './image_types';
import type { SoundFile, SoundRequest, SoundResult } from './sound_types';
import type { VideoRequest, VideoResult } from './video_types';
import type { TextRequest } from './text_types';
import type {
	RecordConfig,
	Recording,
	RecorderCaptureResult,
	RecorderCommand,
} from './recorder_types';
import type { ChannelModelKind, ChannelModelSelection, StoredBotProvider } from './channels_types';
import {
	AgentChannels,
	CoderChannels,
	A2aChannels,
	AppChannels,
	RecorderChannels,
	TaskChannels,
	McpChannels,
	SkillsChannels,
	StorageChannels,
	DatabaseChannels,
	EmbeddingChannels,
	ImageChannels,
	SoundChannels,
	ProviderChannels,
	SearchChannels,
	SpeechChannels,
	RealtimeVoiceChannels,
	SttChannels,
	TextChannels,
	VideoChannels,
	ExtensionChannels,
	WikiChannels,
	DataChannels,
	WindowChannels,
} from './ipc_channels_definitions';
type ProviderStoreRecord = StoredProvider | StoredBotProvider;

export interface CoderInvokeChannelMap {
	[CoderChannels.getSettings]: { args: []; result: import('./coder_types').CoderSettings };
	[CoderChannels.saveSettings]: {
		args: [settings: import('./coder_types').CoderSettings];
		result: import('./coder_types').CoderSettings;
	};
	[CoderChannels.listModels]: { args: []; result: import('./coder_types').CoderCatalog };
	[CoderChannels.listProjects]: { args: []; result: import('./coder_types').CoderProject[] };
	[CoderChannels.addProject]: {
		args: [];
		result: import('./coder_types').CoderProject | undefined;
	};
	[CoderChannels.removeProject]: { args: [projectId: string]; result: boolean };
	[CoderChannels.listSessions]: {
		args: [projectId: string];
		result: import('./coder_types').CoderSessionSummary[];
	};
	[CoderChannels.getSession]: {
		args: [projectId: string, sessionId: string];
		result: import('./coder_types').CoderSessionSnapshot;
	};
	[CoderChannels.send]: {
		args: [request: import('./coder_types').CoderRunRequest, runId: string];
		result: import('./coder_types').CoderRunResult;
	};
	[CoderChannels.cancel]: { args: [runId: string]; result: boolean };
	[CoderChannels.connectCodex]: { args: []; result: import('./coder_types').CoderAuthStatus };
	[CoderChannels.cancelCodexLogin]: { args: []; result: boolean };
	[CoderChannels.disconnectCodex]: { args: []; result: void };
}

export interface CoderEventChannelMap {
	[CoderChannels.response]: { data: import('./coder_types').CoderResponseEvent };
	[CoderChannels.authEvent]: { data: import('./coder_types').CoderAuthEvent };
}

export interface AgentInvokeChannelMap {
	[AgentChannels.send]: {
		args: [message: string, options?: import('./agent_types').AgentRunOptions];
		result: string;
	};
	[AgentChannels.cancel]: { args: [runId: string]; result: boolean };
	[AgentChannels.respondToolPermission]: {
		args: [
			scope: import('./agent_types').AgentToolPermissionScope,
			decision: import('./agent_types').AgentToolPermissionDecision,
		];
		result: boolean;
	};
	[AgentChannels.respondUserInput]: {
		args: [
			scope: import('./agent_types').AgentUserInputScope,
			answers: import('./agent_types').AgentUserInputAnswer[],
		];
		result: boolean;
	};
	[AgentChannels.getPromptInputCapabilities]: {
		args: [];
		result: import('./agent_types').AgentPromptInputCapabilities | null;
	};
	[AgentChannels.lastMessages]: {
		args: [sessionId: string];
		result: import('./agent_types').AgentHistoryMessage[];
	};
	[AgentChannels.editUserMessage]: {
		args: [sessionId: string, userOffsetFromEnd: number, content: string];
		result: boolean;
	};
	[AgentChannels.clearMessages]: { args: [sessionId: string]; result: void };
	[AgentChannels.deleteSession]: { args: [sessionId: string]; result: void };
	[AgentChannels.getWorkspaceLocation]: { args: []; result: string };
	[AgentChannels.listWorkspaceFiles]: {
		args: [];
		result: import('./agent_types').WorkspaceTreeEntry[];
	};
	[AgentChannels.readWorkspaceFile]: { args: [filePath: string]; result: string };
	[AgentChannels.readWorkspaceAsset]: {
		args: [filePath: string];
		result: import('./workspace').WorkspaceAsset;
	};
	[AgentChannels.writeWorkspaceMarkdown]: {
		args: [filePath: string, content: string];
		result: void;
	};
	[AgentChannels.createWorkspaceFile]: {
		args: [parentPath: string, name: string];
		result: string;
	};
	[AgentChannels.createWorkspaceDirectory]: {
		args: [parentPath: string, name: string];
		result: string;
	};
	[AgentChannels.moveWorkspaceEntry]: {
		args: [sourcePath: string, destinationDirectoryPath: string];
		result: string;
	};
	[AgentChannels.renameWorkspaceEntry]: {
		args: [sourcePath: string, name: string];
		result: string;
	};
	[AgentChannels.deleteWorkspaceFile]: {
		args: [filePath: string];
		result: void;
	};
	[AgentChannels.deleteWorkspaceDirectory]: {
		args: [directoryPath: string];
		result: void;
	};
	[AgentChannels.getProvider]: {
		args: [];
		result: import('./provider_types').PublicProvider | undefined;
	};
	[AgentChannels.setProvider]: {
		args: [provider: import('./provider_types').PublicProvider];
		result: boolean;
	};
	[AgentChannels.getModelId]: {
		args: [];
		result: string | undefined;
	};
	[AgentChannels.setModelId]: {
		args: [modelId: string];
		result: boolean;
	};
	[AgentChannels.getModelOptions]: { args: []; result: Record<string, unknown> };
	[AgentChannels.setModelOptions]: {
		args: [options: Record<string, unknown>];
		result: Record<string, unknown>;
	};
	[AgentChannels.policyGet]: {
		args: [];
		result: import('../main/agent/permissions/permissions_types').PermissionsSchema;
	};
	[AgentChannels.policySet]: {
		args: [permissions: import('../main/agent/permissions/permissions_types').PermissionsSchema];
		result: import('../main/agent/permissions/permissions_types').PermissionsSchema;
	};
	[AgentChannels.policyReset]: {
		args: [];
		result: import('../main/agent/permissions/permissions_types').PermissionsSchema;
	};
	[AgentChannels.policyPickDirectory]: { args: []; result: string | undefined };
	[AgentChannels.policyNormalizeDirectory]: { args: [value: string]; result: string };
	[AgentChannels.healthSettings]: {
		args: [];
		result: import('../main/agent/health/health_types').HealthSettings;
	};
	[AgentChannels.healthSaveSettings]: {
		args: [request: Partial<import('../main/agent/health/health_types').HealthSettings>];
		result: import('../main/agent/health/health_types').HealthSettings;
	};
	[AgentChannels.healthResetSettings]: {
		args: [];
		result: import('../main/agent/health/health_types').HealthSettings;
	};
	[AgentChannels.healthData]: { args: []; result: string };
	[AgentChannels.healthSaveData]: { args: [content: string]; result: string };
	[AgentChannels.ragIndex]: {
		args: [];
		result: import('../main/agent/knowledge/rag/types').RagIndexResult;
	};
	[AgentChannels.ragGetConfiguration]: { args: []; result: import('./rag_types').RagConfiguration };
	[AgentChannels.ragSaveConfiguration]: {
		args: [configuration: import('./rag_types').RagConfiguration];
		result: import('./rag_types').RagConfiguration;
	};
	[AgentChannels.ragSearch]: {
		args: [query: string, topK?: number];
		result: import('../main/agent/knowledge/rag/types').RagMatch[];
	};
	[AgentChannels.ragPickFolder]: { args: []; result: string | undefined };
}

export interface RecorderInvokeChannelMap {
	[RecorderChannels.microphone.start]: { args: [config: RecordConfig]; result: Recording };
	[RecorderChannels.microphone.stop]: { args: [id: string]; result: void };
	[RecorderChannels.microphone.cancel]: { args: [id: string]; result: void };
	[RecorderChannels.microphone.list]: { args: []; result: Recording[] };
	[RecorderChannels.microphone.complete]: { args: [result: RecorderCaptureResult]; result: void };
	[RecorderChannels.camera.start]: { args: [config: RecordConfig]; result: Recording };
	[RecorderChannels.camera.stop]: { args: [id: string]; result: void };
	[RecorderChannels.camera.cancel]: { args: [id: string]; result: void };
	[RecorderChannels.camera.list]: { args: []; result: Recording[] };
	[RecorderChannels.camera.complete]: { args: [result: RecorderCaptureResult]; result: void };
	[RecorderChannels.screen.start]: { args: [config: RecordConfig]; result: Recording };
	[RecorderChannels.screen.stop]: { args: [id: string]; result: void };
	[RecorderChannels.screen.cancel]: { args: [id: string]; result: void };
	[RecorderChannels.screen.list]: { args: []; result: Recording[] };
	[RecorderChannels.screen.complete]: { args: [result: RecorderCaptureResult]; result: void };
}

export interface RecorderEventChannelMap {
	[RecorderChannels.microphone.command]: { data: RecorderCommand };
	[RecorderChannels.microphone.event]: { data: Recording };
	[RecorderChannels.camera.command]: { data: RecorderCommand };
	[RecorderChannels.camera.event]: { data: Recording };
	[RecorderChannels.screen.command]: { data: RecorderCommand };
	[RecorderChannels.screen.event]: { data: Recording };
}

export interface TaskInvokeChannelMap {
	[TaskChannels.list]: { args: []; result: import('../main/tasks').TaskSchedule[] };
	[TaskChannels.runNow]: {
		args: [scheduleId: string];
		result: import('../main/tasks').TaskScheduledTask;
	};
	[TaskChannels.delete]: { args: [scheduleId: string]; result: void };
	[TaskChannels.getRuntime]: {
		args: [];
		result: import('../main/tasks').TaskRuntime | undefined;
	};
	[TaskChannels.setRuntime]: {
		args: [providerId: string, modelId: string];
		result: import('../main/tasks').TaskRuntime;
	};
	[TaskChannels.configureCapabilities]: {
		args: [scheduleId: string, enabled: boolean, toolsAllow: string[]];
		result: import('../main/tasks').TaskSchedule;
	};
}

export interface SkillsInvokeChannelMap {
	[SkillsChannels.list]: { args: []; result: import('./skills_types').SkillInfo[] };
	[SkillsChannels.load]: {
		args: [name: string];
		result: import('./skills_types').SkillLoadResult | undefined;
	};
	[SkillsChannels.import]: {
		args: [];
		result: import('./skills_types').SkillImportResult | undefined;
	};
	[SkillsChannels.download]: {
		args: [name: string];
		result: import('./skills_types').SkillDownloadResult | undefined;
	};
	[SkillsChannels.delete]: {
		args: [name: string];
		result: import('./skills_types').SkillDeleteResult;
	};
	[SkillsChannels.openRoot]: { args: []; result: void };
	[SkillsChannels.getRoot]: { args: []; result: string };
}

export interface A2aInvokeChannelMap {
	[A2aChannels.list]: { args: []; result: import('./a2a_types').A2aAgentSummary[] };
	[A2aChannels.save]: {
		args: [input: import('./a2a_types').A2aAgentInput];
		result: import('./a2a_types').A2aAgentSummary;
	};
	[A2aChannels.delete]: { args: [id: string]; result: void };
	[A2aChannels.test]: {
		args: [input: import('./a2a_types').A2aAgentInput];
		result: import('./a2a_types').A2aTestResult;
	};
}

export interface McpInvokeChannelMap {
	[McpChannels.list]: { args: []; result: import('./mcp_types').McpSettings };
	[McpChannels.get]: { args: [id: string]; result: import('./mcp_types').McpSettings };
	[McpChannels.save]: {
		args: [input: import('./mcp_types').McpSettings];
		result: import('./mcp_types').McpSettings;
	};
	[McpChannels.upsert]: {
		args: [id: string, input: import('./mcp_types').McpData];
		result: import('./mcp_types').McpSettings;
	};
	[McpChannels.delete]: { args: [id: string]; result: void };
	[McpChannels.registry]: { args: []; result: import('./mcp_types').McpRegistry };
	[McpChannels.importLocal]: {
		args: [];
		result: import('./mcp_types').McpLocalImportResult | undefined;
	};
	[McpChannels.configureLocal]: {
		args: [id: string, input: import('./mcp_types').McpStdioData];
		result: import('./mcp_types').McpServerInfo;
	};
	[McpChannels.getRoot]: { args: []; result: string };
	[McpChannels.openRoot]: { args: []; result: void };
	[McpChannels.test]: {
		args: [id: string];
		result: import('./mcp_types').McpTestResult;
	};
	[McpChannels.oauthStart]: {
		args: [id: string];
		result: import('./mcp_types').McpOAuthStart;
	};
	[McpChannels.oauthFinish]: { args: [id: string, code: string]; result: void };
}

export interface AgentEventChannelMap {
	[AgentChannels.response]: { data: import('./agent_types').AgentResponseEvent };
	[AgentChannels.workspaceChanged]: { data: import('./agent_types').WorkspaceChangeEvent };
}

export interface AppInvokeChannelMap {
	[AppChannels.openAppDataFolder]: {
		args: [];
		result: void;
	};
	[AppChannels.openDataFolder]: {
		args: [];
		result: void;
	};
	[AppChannels.openProvidersFolder]: {
		args: [];
		result: void;
	};
	[AppChannels.openExternalUrl]: {
		args: [url: string];
		result: void;
	};
	[AppChannels.unfurlUrl]: {
		args: [url: string];
		result: import('./app_types').UrlMetadata;
	};
	[AppChannels.setTrayEnabled]: {
		args: [enabled: boolean];
		result: void;
	};
	[AppChannels.getTrayEnabled]: {
		args: [];
		result: boolean;
	};
	[AppChannels.setLanguage]: {
		args: [language: import('./app_types').AppLanguage];
		result: void;
	};
	[AppChannels.getLanguage]: {
		args: [];
		result: import('./app_types').AppLanguage;
	};
	[AppChannels.setTheme]: {
		args: [theme: import('./app_types').AppTheme];
		result: void;
	};
	[AppChannels.getTheme]: {
		args: [];
		result: import('./app_types').AppTheme;
	};
	[AppChannels.getThemeData]: {
		args: [];
		result: import('./app_types').AppThemeData;
	};
	[AppChannels.getSandboxStatus]: {
		args: [];
		result: import('./sandbox').SandboxStatus;
	};
	[AppChannels.setupSandbox]: {
		args: [];
		result: import('./sandbox').SandboxStatus;
	};
	[AppChannels.getMicrophonePermission]: {
		args: [];
		result: import('./app_types').MicrophonePermissionSettings;
	};
	[AppChannels.setMicrophoneEnabled]: {
		args: [enabled: boolean];
		result: import('./app_types').MicrophonePermissionSettings;
	};
	[AppChannels.requestMicrophonePermission]: {
		args: [];
		result: import('./app_types').MicrophonePermissionSettings;
	};
	[AppChannels.openSystemPreference]: {
		args: [pane: import('./app_types').SystemPreferencePaneId];
		result: void;
	};
	[AppChannels.getCameraPermission]: {
		args: [];
		result: import('./app_types').CameraPermissionSettings;
	};
	[AppChannels.setCameraEnabled]: {
		args: [enabled: boolean];
		result: import('./app_types').CameraPermissionSettings;
	};
	[AppChannels.requestCameraPermission]: {
		args: [];
		result: import('./app_types').CameraPermissionSettings;
	};
	[AppChannels.models]: {
		args: [];
		result: import('./model_types').CatalogModel[];
	};
	[AppChannels.databases]: {
		args: [];
		result: import('./provider_types').CatalogService[];
	};
	[AppChannels.storages]: {
		args: [];
		result: import('./provider_types').CatalogService[];
	};
	[AppChannels.webSearches]: {
		args: [];
		result: import('./provider_types').CatalogWebSearch[];
	};
	[AppChannels.mcps]: {
		args: [];
		result: import('./provider_types').CatalogService[];
	};
	[AppChannels.channels]: {
		args: [];
		result: import('./provider_types').CatalogService[];
	};
	[AppChannels.getChannelModelSelection]: {
		args: [kind: ChannelModelKind];
		result: ChannelModelSelection;
	};
	[AppChannels.setChannelModelSelection]: {
		args: [kind: ChannelModelKind, providerId: string, modelId: string];
		result: void;
	};
	[AppChannels.openVideo]: {
		args: [path: string];
		result: void;
	};
	[AppChannels.showImageContextMenu]: {
		args: [path: string];
		result: void;
	};
	[AppChannels.showVideoContextMenu]: {
		args: [path: string];
		result: void;
	};
	[AppChannels.showAudioContextMenu]: {
		args: [path: string];
		result: void;
	};
	[AppChannels.uploadProvider]: {
		args: [];
		result: string | null;
	};
	[AppChannels.getChannelsStatus]: {
		args: [type?: import('./channels_types').ChannelType];
		result: import('./channels_types').ChannelStatusEvent | undefined;
	};
	[AppChannels.startTelegram]: {
		args: [];
		result: import('./channels_types').ChannelStatusEvent | undefined;
	};
	[AppChannels.stopTelegram]: {
		args: [];
		result: void;
	};
	[AppChannels.restartTelegram]: {
		args: [];
		result: import('./channels_types').ChannelStatusEvent | undefined;
	};
	[AppChannels.getExtensionStoreValue]: {
		args: [key: string];
		result: import('./extension_store_types').ExtensionStoreValue | undefined;
	};
	[AppChannels.setExtensionStoreValue]: {
		args: [key: string, value: import('./extension_store_types').ExtensionStoreValue];
		result: void;
	};
	[AppChannels.deleteExtensionStoreValue]: {
		args: [key: string];
		result: void;
	};
	[AppChannels.readExtensionStoreFile]: {
		args: [path: string];
		result: Uint8Array;
	};
	[AppChannels.writeExtensionStoreFile]: {
		args: [path: string, data: Uint8Array];
		result: void;
	};
	[AppChannels.deleteExtensionStoreFile]: {
		args: [path: string];
		result: void;
	};
}

export interface ProviderInvokeChannelMap {
	[ProviderChannels.get]: {
		args: [id: string];
		result: ProviderStoreRecord | undefined;
	};
	[ProviderChannels.set]: {
		args: [provider: ProviderStoreRecord, kind?: import('./provider_types').StoredProviderKind];
		result: ProviderStoreRecord;
	};
	[ProviderChannels.list]: {
		args: [];
		result: ProviderStoreRecord[];
	};
}

export type ProviderStoreInvokeChannelMap = ProviderInvokeChannelMap;

export interface SearchInvokeChannelMap {
	[SearchChannels.getSettings]: {
		args: [];
		result: import('./search_types').SearchSettings;
	};
	[SearchChannels.saveEngine]: {
		args: [
			engineId: import('./search_types').SearchEngineId,
			input: import('./search_types').SearchEngineInput,
		];
		result: import('./search_types').SearchSettings;
	};
	[SearchChannels.selectEngine]: {
		args: [engineId: import('./search_types').SearchEngineId];
		result: import('./search_types').SearchSettings;
	};
}

export interface WikiInvokeChannelMap {
	[WikiChannels.getSettings]: {
		args: [];
		result: import('./wiki_types').WikiSettings;
	};
	[WikiChannels.getStatus]: {
		args: [];
		result: import('./wiki_types').WikiStatus;
	};
	[WikiChannels.saveSettings]: {
		args: [settings: import('./wiki_types').WikiSettings];
		result: import('./wiki_types').WikiSettings;
	};
	[WikiChannels.run]: {
		args: [];
		result: import('./wiki_types').WikiRunResult;
	};
	[WikiChannels.cancel]: {
		args: [];
		result: boolean;
	};
	[WikiChannels.pickDirectory]: {
		args: [kind: 'source' | 'target'];
		result: string | undefined;
	};
	[WikiChannels.openDirectory]: {
		args: [kind: 'source' | 'target'];
		result: void;
	};
}

export interface DataInvokeChannelMap {
	[DataChannels.listScopes]: {
		args: [];
		result: import('./data_types').DataScope[];
	};
	[DataChannels.export]: {
		args: [scope: import('./data_types').DataScope];
		result: import('./data_types').DataExportResult | undefined;
	};
	[DataChannels.previewPurge]: {
		args: [scope: import('./data_types').DataScope];
		result: import('./data_types').DataPurgePreview;
	};
	[DataChannels.purge]: {
		args: [scope: import('./data_types').DataScope, confirmationId: string];
		result: import('./data_types').DataPurgeResult | undefined;
	};
}

export interface StorageInvokeChannelMap {
	[StorageChannels.getStorages]: {
		args: [];
		result: import('./storage_types').StorageConfig[];
	};
	[StorageChannels.getStorageConfiguration]: {
		args: [];
		result: import('./storage_types').StorageConfiguration;
	};
	[StorageChannels.saveStorageConfiguration]: {
		args: [configuration: import('./storage_types').StorageConfiguration];
		result: import('./storage_types').StorageConfiguration;
	};
	[StorageChannels.saveStorageConfig]: {
		args: [config: import('./storage_types').StorageConfig];
		result: import('./storage_types').StorageConfig;
	};
	[StorageChannels.deleteStorageConfig]: {
		args: [id: string];
		result: void;
	};
	[StorageChannels.testConnection]: {
		args: [config: import('./storage_types').StorageConfig];
		result: import('./storage_types').StorageTestResult;
	};
	[StorageChannels.syncFolders]: {
		args: [];
		result: import('./storage_types').StorageSyncFolder[];
	};
	[StorageChannels.pickFolders]: {
		args: [];
		result: string[];
	};
	[StorageChannels.getOperationStatuses]: {
		args: [];
		result: import('./storage_types').StorageOperationStatus[];
	};
	[StorageChannels.backup]: {
		args: [id: string];
		result: import('./storage_types').StorageOperationStatus;
	};
	[StorageChannels.restore]: {
		args: [id: string];
		result: import('./storage_types').StorageOperationStatus;
	};
}

export interface DatabaseInvokeChannelMap {
	[DatabaseChannels.getConfiguration]: {
		args: [];
		result: import('./database_types').DatabaseConfiguration;
	};
	[DatabaseChannels.saveConfiguration]: {
		args: [configuration: import('./database_types').DatabaseConfiguration];
		result: import('./database_types').DatabaseConfiguration;
	};
}

export interface EmbeddingInvokeChannelMap {
	[EmbeddingChannels.createEmbedding]: {
		args: [request: EmbeddingRequest];
		result: EmbeddingResult;
	};
	[EmbeddingChannels.getProviderId]: {
		args: [];
		result: string | undefined;
	};
	[EmbeddingChannels.setProviderId]: {
		args: [providerId: string];
		result: void;
	};
	[EmbeddingChannels.getModelId]: {
		args: [];
		result: string | undefined;
	};
	[EmbeddingChannels.setModelId]: {
		args: [modelId: string];
		result: void;
	};
}

export interface ImageInvokeChannelMap {
	[ImageChannels.createImage]: {
		args: [request: ImageRequest];
		result: ImageResult;
	};
	[ImageChannels.getProviderId]: {
		args: [];
		result: string | undefined;
	};
	[ImageChannels.setProviderId]: {
		args: [providerId: string];
		result: void;
	};
	[ImageChannels.getModelId]: {
		args: [];
		result: string | undefined;
	};
	[ImageChannels.setModelId]: {
		args: [modelId: string];
		result: void;
	};
	[ImageChannels.getOptions]: { args: []; result: Record<string, unknown> };
	[ImageChannels.setOptions]: {
		args: [options: Record<string, unknown>];
		result: Record<string, unknown>;
	};
}

export interface SoundInvokeChannelMap {
	[SoundChannels.createSound]: {
		args: [request: SoundRequest];
		result: SoundResult;
	};
	[SoundChannels.listSounds]: {
		args: [];
		result: SoundFile[];
	};
	[SoundChannels.getProviderId]: {
		args: [];
		result: string | undefined;
	};
	[SoundChannels.setProviderId]: {
		args: [providerId: string];
		result: void;
	};
	[SoundChannels.getModelId]: {
		args: [];
		result: string | undefined;
	};
	[SoundChannels.setModelId]: {
		args: [modelId: string];
		result: void;
	};
	[SoundChannels.getOptions]: { args: []; result: Record<string, unknown> };
	[SoundChannels.setOptions]: {
		args: [options: Record<string, unknown>];
		result: Record<string, unknown>;
	};
}

export interface VideoInvokeChannelMap {
	[VideoChannels.createVideo]: {
		args: [request: VideoRequest];
		result: VideoResult;
	};
	[VideoChannels.getProviderId]: {
		args: [];
		result: string | undefined;
	};
	[VideoChannels.setProviderId]: {
		args: [providerId: string];
		result: void;
	};
	[VideoChannels.getModelId]: {
		args: [];
		result: string | undefined;
	};
	[VideoChannels.setModelId]: {
		args: [modelId: string];
		result: void;
	};
	[VideoChannels.getOptions]: { args: []; result: Record<string, unknown> };
	[VideoChannels.setOptions]: {
		args: [options: Record<string, unknown>];
		result: Record<string, unknown>;
	};
}

export interface TextInvokeChannelMap {
	[TextChannels.generateText]: {
		args: [request: TextRequest];
		result: string;
	};
	[TextChannels.getProviderId]: {
		args: [];
		result: string | undefined;
	};
	[TextChannels.setProviderId]: {
		args: [providerId: string];
		result: void;
	};
	[TextChannels.getModelId]: {
		args: [];
		result: string | undefined;
	};
	[TextChannels.setModelId]: {
		args: [modelId: string];
		result: void;
	};
}

export interface SpeechInvokeChannelMap {
	[SpeechChannels.synthesize]: {
		args: [request: SpeechSynthesisRequest];
		result: SpeechSynthesisResult;
	};
	[SpeechChannels.getProviderId]: {
		args: [];
		result: string | undefined;
	};
	[SpeechChannels.getOptions]: { args: []; result: Record<string, unknown> };
	[SpeechChannels.setOptions]: {
		args: [options: Record<string, unknown>];
		result: Record<string, unknown>;
	};
	[SpeechChannels.setProviderId]: {
		args: [providerId: string];
		result: void;
	};
	[SpeechChannels.getModelId]: {
		args: [];
		result: string | undefined;
	};
	[SpeechChannels.setModelId]: {
		args: [modelId: string];
		result: void;
	};
}

export interface SttInvokeChannelMap {
	[SttChannels.transcribe]: {
		args: [request: SttTranscriptionRequest];
		result: SttTranscriptionResult;
	};
	[SttChannels.startRealtime]: {
		args: [request: SttRealtimeStartRequest | undefined];
		result: SttRealtimeSession;
	};
	[SttChannels.appendRealtimeAudio]: {
		args: [sessionId: string, audio: string];
		result: void;
	};
	[SttChannels.finishRealtime]: {
		args: [sessionId: string];
		result: void;
	};
	[SttChannels.cancelRealtime]: {
		args: [sessionId: string];
		result: void;
	};
	[SttChannels.getSelection]: {
		args: [mode?: SttSelectionMode];
		result: SttModelSelection | undefined;
	};
	[SttChannels.listProviders]: {
		args: [];
		result: PublicProvider[];
	};
	[SttChannels.listModels]: {
		args: [providerId: string];
		result: ProviderModel[];
	};
	[SttChannels.saveSelection]: {
		args: [providerId: string, modelId: string, mode?: SttSelectionMode];
		result: boolean;
	};
	[SttChannels.getProviderId]: {
		args: [];
		result: string | undefined;
	};
	[SttChannels.setProviderId]: {
		args: [providerId: string];
		result: void;
	};
	[SttChannels.getModelId]: {
		args: [];
		result: string | undefined;
	};
	[SttChannels.setModelId]: {
		args: [modelId: string];
		result: void;
	};
}

export interface RealtimeVoiceInvokeChannelMap {
	[RealtimeVoiceChannels.getSetup]: { args: []; result: RealtimeVoiceSetup };
	[RealtimeVoiceChannels.setSetup]: {
		args: [request: RealtimeVoiceSetupRequest];
		result: RealtimeVoiceSetup;
	};
	[RealtimeVoiceChannels.startSession]: {
		args: [request: RealtimeVoiceStartRequest];
		result: RealtimeVoiceSession;
	};
	[RealtimeVoiceChannels.appendAudio]: {
		args: [sessionId: string, audio: string];
		result: void;
	};
	[RealtimeVoiceChannels.interruptSession]: {
		args: [sessionId: string];
		result: void;
	};
	[RealtimeVoiceChannels.stopSession]: {
		args: [sessionId: string];
		result: void;
	};
	[RealtimeVoiceChannels.getProviderId]: { args: []; result: string | undefined };
	[RealtimeVoiceChannels.setProviderId]: { args: [providerId: string]; result: void };
	[RealtimeVoiceChannels.getModelId]: { args: []; result: string | undefined };
	[RealtimeVoiceChannels.setModelId]: { args: [modelId: string]; result: void };
	[RealtimeVoiceChannels.getOptions]: { args: []; result: Record<string, unknown> };
	[RealtimeVoiceChannels.setOptions]: {
		args: [options: Record<string, unknown>];
		result: Record<string, unknown>;
	};
}

export interface RealtimeVoiceEventChannelMap {
	[RealtimeVoiceChannels.sessionEvent]: { data: RealtimeVoiceEvent };
}

export interface SttEventChannelMap {
	[SttChannels.realtimeEvent]: { data: SttRealtimeEvent };
}

export interface ExtensionsInvokeChannelMap {
	[ExtensionChannels.list]: { args: []; result: import('./extension_types').Extension[] };
	[ExtensionChannels.open]: { args: [extensionId: string]; result: void };
	[ExtensionChannels.openRoot]: { args: []; result: void };
	[ExtensionChannels.delete]: { args: [extensionId: string]; result: boolean };
	[ExtensionChannels.import]: {
		args: [];
		result: import('./extension_types').ExtensionImportResult | undefined;
	};
}

export interface WindowInvokeChannelMap {
	[WindowChannels.isMaximized]: { args: []; result: boolean };
	[WindowChannels.isFullScreen]: { args: []; result: boolean };
	[WindowChannels.showContextMenu]: {
		args: [items: import('./window_types').ContextMenuDescriptor[]];
		result: string | null;
	};
}

export interface WindowSendChannelMap {
	[WindowChannels.minimize]: { args: [] };
	[WindowChannels.maximize]: { args: [] };
	[WindowChannels.close]: { args: [] };
	[WindowChannels.popupMenu]: { args: [] };
}

export interface WindowEventChannelMap {
	[WindowChannels.maximizeChange]: { data: boolean };
	[WindowChannels.fullScreenChange]: { data: boolean };
}

export interface InvokeChannelMap
	extends
		AppInvokeChannelMap,
		AgentInvokeChannelMap,
		CoderInvokeChannelMap,
		RecorderInvokeChannelMap,
		TaskInvokeChannelMap,
		SkillsInvokeChannelMap,
		A2aInvokeChannelMap,
		McpInvokeChannelMap,
		ProviderStoreInvokeChannelMap,
		SearchInvokeChannelMap,
		WikiInvokeChannelMap,
		DataInvokeChannelMap,
		StorageInvokeChannelMap,
		DatabaseInvokeChannelMap,
		WindowInvokeChannelMap,
		EmbeddingInvokeChannelMap,
		ImageInvokeChannelMap,
		SoundInvokeChannelMap,
		SpeechInvokeChannelMap,
		RealtimeVoiceInvokeChannelMap,
		SttInvokeChannelMap,
		TextInvokeChannelMap,
		VideoInvokeChannelMap,
		ExtensionsInvokeChannelMap {}

export interface SendChannelMap extends WindowSendChannelMap {}

export interface AppEventChannelMap {
	[AppChannels.modelsChanged]: { data: void };
	[AppChannels.trayEnabledChanged]: { data: boolean };
	[AppChannels.keepAwakeChanged]: { data: boolean };
	[AppChannels.themeModeChanged]: { data: import('./app_types').AppThemeData };
	[AppChannels.channelsStatusChanged]: { data: import('./channels_types').ChannelStatusEvent };
}

export interface StorageEventChannelMap {
	[StorageChannels.operationStatusChanged]: {
		data: import('./storage_types').StorageOperationStatus;
	};
}

export interface EventChannelMap
	extends
		AppEventChannelMap,
		AgentEventChannelMap,
		CoderEventChannelMap,
		RecorderEventChannelMap,
		StorageEventChannelMap,
		WindowEventChannelMap,
		RealtimeVoiceEventChannelMap,
		SttEventChannelMap {}
