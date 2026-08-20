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
import { StorageOperations } from './storage';
import { StorageChannels } from '../shared/ipc_channels_definitions';

export interface MainServices {
	appState: AppState;
	eventBus: EventBus;
	logger: LoggerService;
	agentService: Agent;
	conversationService: Conversation;
	channelRegistry: ChannelRegistry;
	windowFactory: WindowFactory;
	windowContextManager: WindowContextManager;
	extensionRegistry: ExtensionRegistry;
	extensionStorage: ExtensionStorage;
	storageOperations: StorageOperations;
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
	const channelRegistry = createChannelRegistry({ logger, eventBus, agentService });
	const windowContextManager = new WindowContextManager(logger, eventBus);
	const realtimeVoiceManager = createRealtimeVoiceManager(agentService, windowFactory, eventBus);
	const conversationService = new Conversation(agentService, realtimeVoiceManager);
	const storageOperations = new StorageOperations((status) => {
		eventBus.broadcastToWindows(StorageChannels.operationStatusChanged, status);
	});
	eventBus.on('window:closed', (event) => {
		agentService.cancelWindow((event.payload as { windowId: number }).windowId);
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
		conversationService,
		channelRegistry,
		windowFactory,
		windowContextManager,
		extensionRegistry,
		extensionStorage,
		storageOperations,
	};
}

export async function cleanup(services: MainServices): Promise<void> {
	const { logger, windowContextManager, channelRegistry, conversationService } = services;
	logger.info('Bootstrap', 'Starting cleanup');
	await conversationService.execute({ type: 'voice', action: 'stop-all' });
	await windowContextManager.destroyAll();
	channelRegistry.destroy();
	logger.destroy();
	logger.info('Bootstrap', 'Cleanup complete');
}
