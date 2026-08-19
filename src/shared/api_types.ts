import type {
	CatalogService,
	CatalogWebSearch,
	PublicProvider,
	StoredProviderKind,
} from './provider_types';
import type { StoredProvider as Provider } from './provider_types';
import type { StoredBotProvider as BotProvider } from './channels_types';
import type { SearchEngineId, SearchEngineInput, SearchSettings } from './search_types';
import type {
	StorageConfig,
	StorageConfiguration,
	StoragePullResult,
	StoragePushResult,
	StorageSyncFolder,
	StorageTestResult,
} from './storage_types';
import type { DatabaseConfiguration } from './database_types';
import type {
	McpData,
	McpLocalImportResult,
	McpOAuthStart,
	McpRegistry,
	McpServerInfo,
	McpSettings,
	McpStdioData,
	McpTestResult,
} from './mcp_types';
import type { Extension, ExtensionImportResult } from './extension_types';
import type {
	TaskRuntime,
	TaskSchedule,
	TaskScheduledTask,
} from '../main/tasks/tasks_types';
import type { HealthSettings } from '../main/agent/health/health_types';
import type { RagIndexResult, RagMatch } from '../main/agent/knowledge/rag';
import type { RagConfiguration } from './rag_types';
import type { PermissionsSchema } from '../main/agent/permissions/permissions_types';
import type {
	AgentHistoryMessage,
	AgentPromptInputCapabilities,
	AgentRunOptions,
	AgentResponseEvent,
	AgentSessionSummary,
	AgentSessionSnapshot,
	AgentToolPermissionDecision,
	AgentToolPermissionScope,
	AgentUserInputAnswer,
	AgentUserInputScope,
	WorkspaceChangeEvent,
	WorkspaceTreeEntry,
} from './agent_types';
import type { CatalogModel, ProviderModel } from './model_types';
import type {
	ChannelModelKind,
	ChannelModelSelection,
	ChannelStatusEvent,
	ChannelType,
} from './channels_types';
import type { EmbeddingRequest, EmbeddingResult } from './embedding_types';
import type { ImageRequest, ImageResult } from './image_types';
import type { SoundFile, SoundRequest, SoundResult } from './sound_types';
import type {
	RecordConfig,
	Recording,
	RecorderCaptureResult,
	RecorderCommand,
} from './recorder_types';
import type { VideoRequest, VideoResult } from './video_types';
import type { TextRequest } from './text_types';
import type { SpeechSynthesisRequest, SpeechSynthesisResult } from './speech_types';
import type {
	RealtimeVoiceEvent,
	RealtimeVoiceSession,
	RealtimeVoiceSetup,
	RealtimeVoiceSetupRequest,
	RealtimeVoiceStartRequest,
} from './realtime_voice';
import type {
	SttRealtimeEvent,
	SttRealtimeSession,
	SttRealtimeStartRequest,
	SttTranscriptionRequest,
	SttTranscriptionResult,
	SttModelSelection,
	SttSelectionMode,
} from './stt_transcription';
import type {
	SkillDeleteResult,
	SkillDownloadResult,
	SkillImportResult,
	SkillInfo,
	SkillLoadResult,
} from './skills_types';
import type {
	MicrophonePermissionSettings,
	CameraPermissionSettings,
	SystemPreferencePaneId,
	AppLanguage,
	AppThemeData,
	AppTheme,
} from './app_types';
import type { WikiRunResult, WikiSettings, WikiStatus } from './wiki_types';
import type { ContextMenuDescriptor } from './window_types';
import type { WorkspaceAsset } from './workspace';
import type { ExtensionStorageApi } from './extension_store_types';
import type { SandboxStatus } from './sandbox';
export type { DataApi } from './data_types';
export type { A2aApi } from './a2a_types';

export interface WindowApi {
	minimize: () => void;
	maximize: () => void;
	close: () => void;
	popupMenu: () => void;
	showContextMenu: (items: ContextMenuDescriptor[]) => Promise<string | null>;
	isMaximized: () => Promise<boolean>;
	onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void;
	isFullScreen: () => Promise<boolean>;
	onFullScreenChange: (callback: (isFullScreen: boolean) => void) => () => void;
}

export interface AgentApi {
	send: (
		message: string,
		options?: AgentRunOptions,
		onEvent?: (event: AgentResponseEvent) => void
	) => Promise<string>;
	cancel: (runId: string) => Promise<boolean>;
	respondToolPermission: (
		scope: AgentToolPermissionScope,
		decision: AgentToolPermissionDecision
	) => Promise<boolean>;
	respondUserInput: (
		scope: AgentUserInputScope,
		answers: AgentUserInputAnswer[]
	) => Promise<boolean>;
	getPromptInputCapabilities: () => Promise<AgentPromptInputCapabilities | null>;
	listSessions: () => Promise<AgentSessionSummary[]>;
	renameSession: (sessionId: string, title: string) => Promise<void>;
	getLastMessages: (sessionId: string) => Promise<AgentHistoryMessage[]>;
	getSessionSnapshot: (sessionId: string) => Promise<AgentSessionSnapshot>;
	editUserMessage: (
		sessionId: string,
		userOffsetFromEnd: number,
		content: string
	) => Promise<boolean>;
	clearMessages: (sessionId: string) => Promise<void>;
	deleteSession: (sessionId: string) => Promise<void>;
	getWorkspaceLocation: () => Promise<string>;
	listWorkspaceFiles: () => Promise<WorkspaceTreeEntry[]>;
	onWorkspaceChanged: (callback: (event: WorkspaceChangeEvent) => void) => () => void;
	readWorkspaceFile: (filePath: string) => Promise<string>;
	readWorkspaceAsset: (filePath: string) => Promise<WorkspaceAsset>;
	writeWorkspaceMarkdown: (filePath: string, content: string) => Promise<void>;
	createWorkspaceFile: (parentPath: string, name: string) => Promise<string>;
	createWorkspaceDirectory: (parentPath: string, name: string) => Promise<string>;
	moveWorkspaceEntry: (sourcePath: string, destinationDirectoryPath: string) => Promise<string>;
	renameWorkspaceEntry: (sourcePath: string, name: string) => Promise<string>;
	deleteWorkspaceFile: (filePath: string) => Promise<void>;
	deleteWorkspaceDirectory: (directoryPath: string) => Promise<void>;
	getProvider: () => Promise<PublicProvider | undefined>;
	setProvider: (provider: PublicProvider) => Promise<boolean>;
	getModelId: () => Promise<string | undefined>;
	setModelId: (modelId: string) => Promise<boolean>;
	getModelOptions: () => Promise<Record<string, unknown>>;
	setModelOptions: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
	policyGet: () => Promise<PermissionsSchema>;
	policySet: (permissions: PermissionsSchema) => Promise<PermissionsSchema>;
	policyReset: () => Promise<PermissionsSchema>;
	policyPickDirectory: () => Promise<string | undefined>;
	policyNormalizeDirectory: (value: string) => Promise<string>;
	healthGetSettings: () => Promise<HealthSettings>;
	healthSaveSettings: (settings: Partial<HealthSettings>) => Promise<HealthSettings>;
	healthResetSettings: () => Promise<HealthSettings>;
	healthGetData: () => Promise<string>;
	healthSaveData: (content: string) => Promise<string>;
	ragIndex: () => Promise<RagIndexResult>;
	ragGetConfiguration: () => Promise<RagConfiguration>;
	ragSaveConfiguration: (configuration: RagConfiguration) => Promise<RagConfiguration>;
	ragSearch: (query: string, topK?: number) => Promise<RagMatch[]>;
	ragPickFolder: () => Promise<string | undefined>;
}

export interface TaskApi {
	list: () => Promise<TaskSchedule[]>;
	runNow: (scheduleId: string) => Promise<TaskScheduledTask>;
	delete: (scheduleId: string) => Promise<void>;
	getRuntime: () => Promise<TaskRuntime | undefined>;
	setRuntime: (providerId: string, modelId: string) => Promise<TaskRuntime>;
	configureCapabilities: (
		scheduleId: string,
		enabled: boolean,
		toolsAllow: string[]
	) => Promise<TaskSchedule>;
}

export interface SkillsApi {
	list: () => Promise<SkillInfo[]>;
	load: (name: string) => Promise<SkillLoadResult | undefined>;
	import: () => Promise<SkillImportResult | undefined>;
	download: (name: string) => Promise<SkillDownloadResult | undefined>;
	delete: (name: string) => Promise<SkillDeleteResult>;
	openRoot: () => Promise<void>;
	getRoot: () => Promise<string>;
}

export interface McpApi {
	list: () => Promise<McpSettings>;
	get: (id: string) => Promise<McpSettings>;
	save: (input: McpSettings) => Promise<McpSettings>;
	upsert: (id: string, input: McpData) => Promise<McpSettings>;
	delete: (id: string) => Promise<void>;
	registry: () => Promise<McpRegistry>;
	importLocal: () => Promise<McpLocalImportResult | undefined>;
	configureLocal: (id: string, input: McpStdioData) => Promise<McpServerInfo>;
	getRoot: () => Promise<string>;
	openRoot: () => Promise<void>;
	test: (id: string) => Promise<McpTestResult>;
	oauthStart: (id: string) => Promise<McpOAuthStart>;
	oauthFinish: (id: string, code: string) => Promise<void>;
}

export interface ProviderApi {
	get: (id: string) => Promise<ProviderStoreRecord | undefined>;
	set: (provider: ProviderStoreRecord, kind?: StoredProviderKind) => Promise<ProviderStoreRecord>;
	list: () => Promise<ProviderStoreRecord[]>;
	getModelProviders: () => Promise<PublicProvider[]>;
	getStorageProviders: () => Promise<PublicProvider[]>;
	getDatabaseProviders: () => Promise<PublicProvider[]>;
}

export interface StorageApi {
	getStorages: () => Promise<StorageConfig[]>;
	getStorageConfiguration: () => Promise<StorageConfiguration>;
	saveStorageConfiguration: (configuration: StorageConfiguration) => Promise<StorageConfiguration>;
	saveStorageConfig: (config: StorageConfig) => Promise<StorageConfig>;
	deleteStorageConfig: (id: string) => Promise<void>;
	testConnection: (config: StorageConfig) => Promise<StorageTestResult>;
	syncFolders: () => Promise<StorageSyncFolder[]>;
	pickFolders: () => Promise<string[]>;
	backup: (id: string) => Promise<StoragePushResult>;
	restore: (id: string) => Promise<StoragePullResult>;
}

export interface DatabaseApi {
	getConfiguration: () => Promise<DatabaseConfiguration>;
	saveConfiguration: (configuration: DatabaseConfiguration) => Promise<DatabaseConfiguration>;
}

export interface ExtensionsApi {
	list: () => Promise<Extension[]>;
	open: (extensionId: string) => Promise<void>;
	openRoot: () => Promise<void>;
	delete: (extensionId: string) => Promise<boolean>;
	import: () => Promise<ExtensionImportResult | undefined>;
}

export interface SearchApi {
	getSettings: () => Promise<SearchSettings>;
	saveEngine: (engineId: SearchEngineId, input: SearchEngineInput) => Promise<SearchSettings>;
	selectEngine: (engineId: SearchEngineId) => Promise<SearchSettings>;
}

export interface WikiApi {
	getSettings: () => Promise<WikiSettings>;
	getStatus: () => Promise<WikiStatus>;
	saveSettings: (settings: WikiSettings) => Promise<WikiSettings>;
	run: () => Promise<WikiRunResult>;
	cancel: () => Promise<boolean>;
	pickDirectory: (kind: 'source' | 'target') => Promise<string | undefined>;
	openDirectory: (kind: 'source' | 'target') => Promise<void>;
}

export interface RecorderApi {
	microphone: {
		start: (config: RecordConfig) => Promise<Recording>;
		stop: (id: string) => Promise<void>;
		cancel: (id: string) => Promise<void>;
		list: () => Promise<Recording[]>;
		complete: (result: RecorderCaptureResult) => Promise<void>;
		onCommand: (callback: (command: RecorderCommand) => void) => () => void;
		onEvent: (callback: (recording: Recording) => void) => () => void;
	};
	camera: {
		start: (config: RecordConfig) => Promise<Recording>;
		stop: (id: string) => Promise<void>;
		cancel: (id: string) => Promise<void>;
		list: () => Promise<Recording[]>;
		complete: (result: RecorderCaptureResult) => Promise<void>;
		onCommand: (callback: (command: RecorderCommand) => void) => () => void;
		onEvent: (callback: (recording: Recording) => void) => () => void;
	};
	screen: {
		start: (config: RecordConfig) => Promise<Recording>;
		stop: (id: string) => Promise<void>;
		cancel: (id: string) => Promise<void>;
		list: () => Promise<Recording[]>;
		complete: (result: RecorderCaptureResult) => Promise<void>;
		onCommand: (callback: (command: RecorderCommand) => void) => () => void;
		onEvent: (callback: (recording: Recording) => void) => () => void;
	};
}

export interface ModelsApi {
	embedding: {
		createEmbedding: (request: EmbeddingRequest) => Promise<EmbeddingResult>;
		getProviderId: () => Promise<string | undefined>;
		setProviderId: (providerId: string) => Promise<void>;
		getModelId: () => Promise<string | undefined>;
		setModelId: (modelId: string) => Promise<void>;
	};
	image: {
		createImage: (request: ImageRequest) => Promise<ImageResult>;
		getOptions: () => Promise<Record<string, unknown>>;
		setOptions: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
		getProviderId: () => Promise<string | undefined>;
		setProviderId: (providerId: string) => Promise<void>;
		getModelId: () => Promise<string | undefined>;
		setModelId: (modelId: string) => Promise<void>;
	};
	sound: {
		createSound: (request: SoundRequest) => Promise<SoundResult>;
		listSounds: () => Promise<SoundFile[]>;
		getOptions: () => Promise<Record<string, unknown>>;
		setOptions: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
		getProviderId: () => Promise<string | undefined>;
		setProviderId: (providerId: string) => Promise<void>;
		getModelId: () => Promise<string | undefined>;
		setModelId: (modelId: string) => Promise<void>;
	};
	text: {
		generateText: (request: TextRequest) => Promise<string>;
		getProviderId: () => Promise<string | undefined>;
		setProviderId: (providerId: string) => Promise<void>;
		getModelId: () => Promise<string | undefined>;
		setModelId: (modelId: string) => Promise<void>;
	};
	transcribe: {
		transcribe: (request: SttTranscriptionRequest) => Promise<SttTranscriptionResult>;
		startRealtime: (request?: SttRealtimeStartRequest) => Promise<SttRealtimeSession>;
		appendRealtimeAudio: (sessionId: string, audio: string) => Promise<void>;
		finishRealtime: (sessionId: string) => Promise<void>;
		cancelRealtime: (sessionId: string) => Promise<void>;
		onRealtimeEvent: (callback: (event: SttRealtimeEvent) => void) => () => void;
		getSelection: (mode?: SttSelectionMode) => Promise<SttModelSelection | undefined>;
		listProviders: () => Promise<PublicProvider[]>;
		listModels: (providerId: string) => Promise<ProviderModel[]>;
		saveSelection: (
			providerId: string,
			modelId: string,
			mode?: SttSelectionMode
		) => Promise<boolean>;
		getProviderId: () => Promise<string | undefined>;
		setProviderId: (providerId: string) => Promise<void>;
		getModelId: () => Promise<string | undefined>;
		setModelId: (modelId: string) => Promise<void>;
	};
	video: {
		createVideo: (request: VideoRequest) => Promise<VideoResult>;
		getOptions: () => Promise<Record<string, unknown>>;
		setOptions: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
		getProviderId: () => Promise<string | undefined>;
		setProviderId: (providerId: string) => Promise<void>;
		getModelId: () => Promise<string | undefined>;
		setModelId: (modelId: string) => Promise<void>;
	};
	voice: {
		synthesize: (request: SpeechSynthesisRequest) => Promise<SpeechSynthesisResult>;
		getOptions: () => Promise<Record<string, unknown>>;
		setOptions: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
		getProviderId: () => Promise<string | undefined>;
		setProviderId: (providerId: string) => Promise<void>;
		getModelId: () => Promise<string | undefined>;
		setModelId: (modelId: string) => Promise<void>;
	};
	realtimeVoice: {
		getSetup: () => Promise<RealtimeVoiceSetup>;
		setSetup: (request: RealtimeVoiceSetupRequest) => Promise<RealtimeVoiceSetup>;
		startSession: (request: RealtimeVoiceStartRequest) => Promise<RealtimeVoiceSession>;
		appendAudio: (sessionId: string, audio: string) => Promise<void>;
		interruptSession: (sessionId: string) => Promise<void>;
		stopSession: (sessionId: string) => Promise<void>;
		onSessionEvent: (callback: (event: RealtimeVoiceEvent) => void) => () => void;
		getOptions: () => Promise<Record<string, unknown>>;
		setOptions: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
		getProviderId: () => Promise<string | undefined>;
		setProviderId: (providerId: string) => Promise<void>;
		getModelId: () => Promise<string | undefined>;
		setModelId: (modelId: string) => Promise<void>;
	};
}

type ProviderStoreRecord = Provider | BotProvider;

export interface AppApi extends ExtensionStorageApi {
	models: () => Promise<CatalogModel[]>;
	databases: () => Promise<CatalogService[]>;
	storages: () => Promise<CatalogService[]>;
	webSearches: () => Promise<CatalogWebSearch[]>;
	mcps: () => Promise<CatalogService[]>;
	channels: () => Promise<CatalogService[]>;
	getChannelsModelSelection: (kind: ChannelModelKind) => Promise<ChannelModelSelection>;
	setChannelsModelSelection: (
		kind: ChannelModelKind,
		providerId: string,
		modelId: string
	) => Promise<void>;
	/** Fires when resources/providers changes on disk; returns an unsubscribe function. */
	onModelsChanged: (callback: () => void) => () => void;
	getPathForFile: (file: File) => string;
	openAppDataFolder: () => Promise<void>;
	openDataFolder: () => Promise<void>;
	openProvidersFolder: () => Promise<void>;
	openExternalUrl: (url: string) => Promise<void>;
	unfurlUrl: (url: string) => Promise<import('./app_types').UrlMetadata>;
	setTrayEnabled: (enabled: boolean) => Promise<void>;
	getTrayEnabled: () => Promise<boolean>;
	onTrayEnabledChanged: (callback: (enabled: boolean) => void) => () => void;
	setKeepAwake: (enabled: boolean) => Promise<void>;
	getKeepAwake: () => Promise<boolean>;
	onKeepAwakeChanged: (callback: (enabled: boolean) => void) => () => void;
	setLanguage: (language: AppLanguage) => Promise<void>;
	getLanguage: () => Promise<AppLanguage>;
	setTheme: (theme: AppTheme) => Promise<void>;
	getTheme: () => Promise<AppTheme>;
	getThemeData: () => Promise<AppThemeData>;
	getSandboxStatus: () => Promise<SandboxStatus>;
	setupSandbox: () => Promise<SandboxStatus>;
	/**
	 * Fires when theme mode or resolved dark-mode state changes.
	 * Returns a cleanup function to remove the listener.
	 */
	onThemeModeChanged: (callback: (theme: AppThemeData) => void) => () => void;
	getMicrophonePermission: () => Promise<MicrophonePermissionSettings>;
	setMicrophoneEnabled: (enabled: boolean) => Promise<MicrophonePermissionSettings>;
	requestMicrophonePermission: () => Promise<MicrophonePermissionSettings>;
	openSystemPreference: (pane: SystemPreferencePaneId) => Promise<void>;
	getCameraPermission: () => Promise<CameraPermissionSettings>;
	setCameraEnabled: (enabled: boolean) => Promise<CameraPermissionSettings>;
	requestCameraPermission: () => Promise<CameraPermissionSettings>;
	openVideo: (path: string) => Promise<void>;
	showImageContextMenu: (path: string) => Promise<void>;
	showVideoContextMenu: (path: string) => Promise<void>;
	showAudioContextMenu: (path: string) => Promise<void>;
	/** Pick a provider folder and copy it into the providers catalog; null when canceled. */
	uploadProvider: () => Promise<string | null>;
	getChannelsStatus: (type?: ChannelType) => Promise<ChannelStatusEvent | undefined>;
	startTelegram: () => Promise<ChannelStatusEvent | undefined>;
	stopTelegram: () => Promise<void>;
	restartTelegram: () => Promise<ChannelStatusEvent | undefined>;
	onChannelsStatusChanged: (callback: (event: ChannelStatusEvent) => void) => () => void;
}
