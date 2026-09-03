import { AppState } from './app_state';
import { EventBus } from './event_bus';
import { WindowContextManager } from './window_context';
import { WindowFactory } from './window_factory';
import { LoggerService } from './shared';
import { createChannelRegistry, type ChannelRegistry } from './channels';
import { ExtensionRegistry, ExtensionStorage } from './extensions/extension_index';

import { Agent } from './agent/agent';
import { Conversation } from './agent/conversation';
import { ExecSandbox } from './agent/sandbox';
import { createRealtimeVoiceManager } from './agent/realtime_voice';
import { StorageOperations, pullFiles, pushFiles, withStorageLock } from './storage';
import { preventStorageSuspension } from './storage/storage_suspension';
import { StorageChannels } from '../shared/ipc_channels_definitions';
import { Coder, CoderProjectStore, CoderStore } from './coder';
import { getProvider } from './settings_store';
import { agentLocation } from './shared/agent_location';
import { EnvironmentManager } from './terminal/environment';
import { PtyManager } from './terminal/manager';
import { ShellDetector } from './terminal/shell';
import { AuthService } from './cloud/auth';
import { CloudService } from './cloud/cloud';
import { loadCloudConfig } from './cloud/config';
import { ProviderSyncService } from './providers/sync';

export interface MainServices {
	appState: AppState;
	eventBus: EventBus;
	logger: LoggerService;
	agentService: Agent;
	coderService: Coder;
	conversationService: Conversation;
	channelRegistry: ChannelRegistry;
	windowFactory: WindowFactory;
	windowContextManager: WindowContextManager;
	extensionRegistry: ExtensionRegistry;
	extensionStorage: ExtensionStorage;
	storageOperations: StorageOperations;
	terminalManager: PtyManager;
	authService: AuthService;
	cloudService: CloudService;
	providerSyncService: ProviderSyncService;
}

export interface BootstrapResult extends MainServices {}

export function bootstrapServices(): BootstrapResult {
	const appState = new AppState();
	const eventBus = new EventBus();
	const logger = new LoggerService(eventBus);
	const extensionRegistry = new ExtensionRegistry();
	const extensionStorage = new ExtensionStorage();
	const windowFactory = new WindowFactory(logger, extensionRegistry);
	const agentService = new Agent(windowFactory, new ExecSandbox());
	const coderStore = new CoderStore();
	const coderService = new Coder({
		store: coderStore,
		projects: new CoderProjectStore(
			undefined,
			[agentLocation(), coderStore.getLegacyWorkingDirectory()].filter(
				(directory): directory is string => Boolean(directory)
			)
		),
		getProvider: (providerId) => getProvider(providerId, 'models'),
	});
	const channelRegistry = createChannelRegistry({ logger, eventBus, agentService });
	const windowContextManager = new WindowContextManager(logger, eventBus);
	const realtimeVoiceManager = createRealtimeVoiceManager(agentService, windowFactory, eventBus);
	const conversationService = new Conversation(agentService, realtimeVoiceManager);
	const authService = new AuthService(loadCloudConfig());
	const storageOperations = new StorageOperations(
		(status) => {
			eventBus.broadcastToWindows(StorageChannels.operationStatusChanged, status);
		},
		{
			backup: () => pushFiles(authService),
			restore: () => pullFiles(authService),
			lock: withStorageLock,
			preventSuspension: preventStorageSuspension,
		}
	);
	const terminalManager = new PtyManager(
		logger,
		new ShellDetector(),
		new EnvironmentManager(logger)
	);
	const cloudService = new CloudService(authService);
	const providerSyncService = new ProviderSyncService(authService);
	eventBus.on('window:closed', (event) => {
		agentService.cancelWindow((event.payload as { windowId: number }).windowId);
		coderService.cancelWindow((event.payload as { windowId: number }).windowId);
		void conversationService.execute({
			type: 'voice',
			action: 'stop-window',
			windowId: (event.payload as { windowId: number }).windowId,
		});
	});

	logger.info('Bootstrap', 'Registered global services');

	return {
		appState,
		eventBus,
		logger,
		agentService,
		coderService,
		conversationService,
		channelRegistry,
		windowFactory,
		windowContextManager,
		extensionRegistry,
		extensionStorage,
		storageOperations,
		terminalManager,
		authService,
		cloudService,
		providerSyncService,
	};
}

export async function cleanup(services: MainServices): Promise<void> {
	const {
		logger,
		windowContextManager,
		channelRegistry,
		conversationService,
		terminalManager,
		cloudService,
		providerSyncService,
		authService,
		agentService,
		coderService,
	} = services;
	logger.info('Bootstrap', 'Starting cleanup');
	terminalManager.shutdown();
	agentService.destroy();
	coderService.destroy();
	await conversationService.execute({ type: 'voice', action: 'stop-all' });
	await windowContextManager.destroyAll();
	await cloudService.destroy();
	providerSyncService.destroy();
	authService.destroy();
	channelRegistry.destroy();
	logger.info('Bootstrap', 'Cleanup complete');
	logger.destroy();
}
