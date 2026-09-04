import { BrowserWindow, type IpcMainInvokeEvent } from 'electron';
import type { EventBus } from '../event_bus';
import { A2aChannels } from '../../shared/ipc_channels_definitions';
import type { A2aAgentInput } from '../../shared/a2a_types';
import { getA2aAgents, removeA2aAgent, saveA2aAgent, testA2aAgent } from '../agent/a2a';
import { publicA2aAgent } from '../agent/a2a/public';
import type { AppRegistry } from '../apps/app_registry';
import { registerCommandWithEvent, registerQueryWithEvent } from './core/gateway';
import type { IpcModule } from './core/module';

export interface A2aIpcDeps {
	appRegistry: AppRegistry;
}

export class A2aIpc implements IpcModule<A2aIpcDeps> {
	readonly name = 'a2a';
	register({ appRegistry }: A2aIpcDeps, _eventBus: EventBus): void {
		const assertAppRenderer = (event: IpcMainInvokeEvent): void => {
			if (appRegistry.has(event.sender) || !BrowserWindow.fromWebContents(event.sender)) {
				throw new Error('A2A settings are unavailable to app views.');
			}
		};
		registerQueryWithEvent(A2aChannels.list, (event) => {
			assertAppRenderer(event);
			return getA2aAgents().map(publicA2aAgent);
		});
		registerCommandWithEvent(A2aChannels.save, async (event, input: A2aAgentInput) => {
			assertAppRenderer(event);
			return publicA2aAgent(await saveA2aAgent(input));
		});
		registerCommandWithEvent(A2aChannels.delete, (event, id: string) => {
			assertAppRenderer(event);
			return removeA2aAgent(id);
		});
		registerCommandWithEvent(A2aChannels.test, (event, input: A2aAgentInput) => {
			assertAppRenderer(event);
			return testA2aAgent(input);
		});
	}
}
