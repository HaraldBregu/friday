import { AgentIpc } from '../agent';
import { A2aIpc } from '../a2a';
import { AppIpc } from '../app';
import { RecorderIpc } from '../recorder';
import { TaskIpc } from '../tasks';
import { McpIpc } from '../mcp';
import { ModelsIpc } from '../models';
import { SkillsIpc } from '../skills';
import { ProviderStoreIpc } from '../provider';
import { SearchIpc } from '../search';
import { StorageIpc } from '../storage';
import { DatabaseIpc } from '../database';
import { ExtensionsIpc } from '../extensions';
import { WikiIpc } from '../wiki';
import { WindowIpc } from '../window';
import { DataIpc } from '../data';
import { RealtimeVoiceIpc } from '../realtime_voice';
import { CoderIpc } from '../coder';
import { TerminalIpc } from '../terminal';
import { AuthIpc } from '../auth';
import { CloudIpc } from '../cloud';
import type { EventBus } from '../../event_bus';
import type { MainServices } from '../../bootstrap';

export function registerIpcHandlers(services: MainServices, eventBus: EventBus): void {
	const {
		logger,
		agentService,
		coderService,
		conversationService,
		channelRegistry,
		windowFactory,
		extensionRegistry,
		extensionStorage,
		storageOperations,
		terminalManager,
		windowContextManager,
		authService,
		cloudService,
		providerSyncService,
	} = services;

	const safeRegister = (name: string, register: () => void): void => {
		try {
			register();
		} catch (error) {
			logger.error('Bootstrap', `Failed to register IPC module: ${name}`, error);
		}
	};

	safeRegister('app', () =>
		new AppIpc().register(
			{
				logger,
				channelRegistry,
				extensionRegistry,
				extensionStorage,
				sandbox: agentService.sandbox,
			},
			eventBus
		)
	);
	safeRegister('a2a', () => new A2aIpc().register({ extensionRegistry }, eventBus));
	safeRegister('auth', () =>
		new AuthIpc().register(
			{ auth: authService, windows: windowContextManager, extensions: extensionRegistry },
			eventBus
		)
	);
	safeRegister('cloud', () =>
		new CloudIpc().register(
			{ cloud: cloudService, windows: windowContextManager, extensions: extensionRegistry },
			eventBus
		)
	);
	safeRegister('agent', () =>
		new AgentIpc().register(
			{
				logger,
				agent: agentService,
				conversation: conversationService,
				windows: windowContextManager,
				extensions: extensionRegistry,
			},
			eventBus
		)
	);
	safeRegister('coder', () =>
		new CoderIpc().register(
			{ coder: coderService, extensionRegistry, windows: windowContextManager },
			eventBus
		)
	);
	safeRegister('recorder', () =>
		new RecorderIpc().register(
			{ windows: windowContextManager, extensions: extensionRegistry },
			eventBus
		)
	);
	safeRegister('tasks', () =>
		new TaskIpc().register(
			{ windows: windowContextManager, extensions: extensionRegistry },
			eventBus
		)
	);
	safeRegister('mcp', () =>
		new McpIpc().register(
			{ windows: windowContextManager, extensions: extensionRegistry },
			eventBus
		)
	);
	safeRegister('models', () => new ModelsIpc().register(undefined, eventBus));
	safeRegister('realtime-voice', () =>
		new RealtimeVoiceIpc().register({ conversation: conversationService }, eventBus)
	);
	safeRegister('skills', () =>
		new SkillsIpc().register(
			{ windows: windowContextManager, extensions: extensionRegistry },
			eventBus
		)
	);
	safeRegister('provider-store', () =>
		new ProviderStoreIpc().register(
			{
				sync: providerSyncService,
				windows: windowContextManager,
				extensions: extensionRegistry,
			},
			eventBus
		)
	);
	safeRegister('search', () =>
		new SearchIpc().register(
			{ windows: windowContextManager, extensions: extensionRegistry },
			eventBus
		)
	);
	safeRegister('storage', () =>
		new StorageIpc().register(
			{ extensionRegistry, storageOperations, windows: windowContextManager },
			eventBus
		)
	);
	safeRegister('database', () => new DatabaseIpc().register(undefined, eventBus));
	safeRegister('extensions', () =>
		new ExtensionsIpc().register(
			{ windowFactory, extensionRegistry, windows: windowContextManager },
			eventBus
		)
	);
	safeRegister('wiki', () => new WikiIpc().register(undefined, eventBus));
	safeRegister('data', () => new DataIpc().register({ agent: agentService }, eventBus));
	safeRegister('window', () => new WindowIpc().register({ logger, extensionRegistry }, eventBus));
	safeRegister('terminal', () =>
		new TerminalIpc().register(
			{
				logger,
				manager: terminalManager,
				windows: windowContextManager,
				extensions: extensionRegistry,
			},
			eventBus
		)
	);

	logger.info('Bootstrap', 'Registered IPC modules');
}
