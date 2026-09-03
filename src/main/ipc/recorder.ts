import type { IpcModule } from './core/module';
import type { EventBus } from '../event_bus';
import { registerCommandWithEvent } from './core/gateway';
import { RecorderChannels } from '../../shared/ipc_channels_definitions';
import { camera, microphone, screen } from '../recorder';
import type { ExtensionRegistry } from '../extensions/extension_registry';
import type { WindowContextManager } from '../window_context';
import { TrustedRenderer } from './core/trusted';

export interface RecorderIpcDeps {
	windows: WindowContextManager;
	extensions: ExtensionRegistry;
}

export class RecorderIpc implements IpcModule<RecorderIpcDeps> {
	readonly name = 'recorder';

	register({ windows, extensions }: RecorderIpcDeps, _eventBus: EventBus): void {
		const trusted = new TrustedRenderer(windows, extensions);
		registerCommandWithEvent(RecorderChannels.microphone.complete, (event, result) => {
			trusted.assert(event);
			return microphone.complete(result, event.sender.id);
		});
		registerCommandWithEvent(RecorderChannels.camera.complete, (event, result) => {
			trusted.assert(event);
			return camera.complete(result, event.sender.id);
		});
		registerCommandWithEvent(RecorderChannels.screen.complete, (event, result) => {
			trusted.assert(event);
			return screen.complete(result, event.sender.id);
		});
	}
}
