import type { IpcModule } from './core/module';
import type { EventBus } from '../event_bus';
import { DatabaseChannels } from '../../shared/ipc_channels_definitions';
import { getDatabaseConfiguration, saveDatabaseConfiguration } from '../database/database_store';
import type { ExtensionRegistry } from '../extensions/extension_registry';
import type { WindowContextManager } from '../window_context';
import { TrustedRenderer } from './core/trusted';

export interface DatabaseIpcDependencies {
	windows: WindowContextManager;
	extensions: ExtensionRegistry;
}

export class DatabaseIpc implements IpcModule<DatabaseIpcDependencies> {
	readonly name = 'database';

	register({ windows, extensions }: DatabaseIpcDependencies, _eventBus: EventBus): void {
		const trusted = new TrustedRenderer(windows, extensions);
		trusted.query(DatabaseChannels.getConfiguration, () => getDatabaseConfiguration());
		trusted.command(DatabaseChannels.saveConfiguration, (configuration) =>
			saveDatabaseConfiguration(configuration)
		);
	}
}
