import type { EventBus } from '../event_bus';
import { A2aChannels } from '../../shared/ipc_channels_definitions';
import type { A2aAgentInput } from '../../shared/a2a_types';
import { getA2aAgents, removeA2aAgent, saveA2aAgent, testA2aAgent } from '../agent/a2a';
import { registerCommand, registerQuery } from './core/gateway';
import type { IpcModule } from './core/module';

export class A2aIpc implements IpcModule {
	readonly name = 'a2a';
	register(_deps: void, _eventBus: EventBus): void {
		registerQuery(A2aChannels.list, () => getA2aAgents());
		registerCommand(A2aChannels.save, (input: A2aAgentInput) => saveA2aAgent(input));
		registerCommand(A2aChannels.delete, (id: string) => removeA2aAgent(id));
		registerCommand(A2aChannels.test, (input: A2aAgentInput) => testA2aAgent(input));
	}
}
