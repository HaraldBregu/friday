import type { EventBus } from '../event_bus';
import type { AppRegistry } from '../apps/app_registry';
import type { WindowContextManager } from '../window_context';
import { SkillsChannels } from '../../shared/ipc_channels_definitions';
import * as skills from '../agent/skills';
import { registerCommandWithEvent, registerQueryWithEvent } from './core/gateway';
import type { IpcModule } from './core/module';
import { TrustedRenderer } from './core/trusted';

export interface SkillsIpcDependencies {
	windows: WindowContextManager;
	apps: AppRegistry;
}

export class SkillsIpc implements IpcModule<SkillsIpcDependencies> {
	readonly name = 'skills';

	register({ windows, apps }: SkillsIpcDependencies, _eventBus: EventBus): void {
		const trusted = new TrustedRenderer(windows, apps);
		registerQueryWithEvent(SkillsChannels.list, (event) => {
			trusted.assert(event);
			return skills.list();
		});
		registerQueryWithEvent(SkillsChannels.load, (event, name: string) => {
			trusted.assert(event);
			return skills.loadSkill(name);
		});
		registerCommandWithEvent(SkillsChannels.import, (event) => {
			trusted.assert(event);
			return skills.importSkills();
		});
		registerCommandWithEvent(SkillsChannels.download, (event, name: string) => {
			trusted.assert(event);
			return skills.downloadSkill(name);
		});
		registerCommandWithEvent(SkillsChannels.delete, (event, name: string) => {
			trusted.assert(event);
			return skills.deleteSkill(name);
		});
		registerCommandWithEvent(SkillsChannels.openRoot, (event) => {
			trusted.assert(event);
			return skills.openRoot();
		});
		registerQueryWithEvent(SkillsChannels.getRoot, (event) => {
			trusted.assert(event);
			return skills.getRoot();
		});
	}
}
