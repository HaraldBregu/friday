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
import type { EventBus } from '../../event_bus';
import type { MainServices } from '../../bootstrap';

export function registerIpcHandlers(services: MainServices, eventBus: EventBus): void {
	const {
		logger,
		agentService,
		conversationService,
		channelRegistry,
		windowFactory,
		extensionRegistry,
		extensionStorage,
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
	safeRegister('agent', () =>
		new AgentIpc().register(
			{ logger, agent: agentService, conversation: conversationService },
			eventBus
		)
	);
	safeRegister('recorder', () => new RecorderIpc().register(undefined, eventBus));
	safeRegister('tasks', () => new TaskIpc().register(undefined, eventBus));
	safeRegister('mcp', () => new McpIpc().register(undefined, eventBus));
	safeRegister('models', () => new ModelsIpc().register(undefined, eventBus));
	safeRegister('realtime-voice', () =>
		new RealtimeVoiceIpc().register({ conversation: conversationService }, eventBus)
	);
	safeRegister('skills', () => new SkillsIpc().register(undefined, eventBus));
	safeRegister('provider-store', () => new ProviderStoreIpc().register(undefined, eventBus));
	safeRegister('search', () => new SearchIpc().register(undefined, eventBus));
	safeRegister('storage', () => new StorageIpc().register(undefined, eventBus));
	safeRegister('database', () => new DatabaseIpc().register(undefined, eventBus));
	safeRegister('extensions', () => new ExtensionsIpc().register({ windowFactory }, eventBus));
	safeRegister('wiki', () => new WikiIpc().register(undefined, eventBus));
	safeRegister('data', () => new DataIpc().register({ agent: agentService }, eventBus));
	safeRegister('window', () => new WindowIpc().register({ logger }, eventBus));

	logger.info('Bootstrap', 'Registered IPC modules');
}
