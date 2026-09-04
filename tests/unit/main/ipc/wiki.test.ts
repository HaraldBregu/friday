const getWikiSettings = jest.fn();
const getWikiStatus = jest.fn();
const runWiki = jest.fn();
const cancelWiki = jest.fn();
const saveWikiSettings = jest.fn();

jest.mock('../../../../src/main/agent/knowledge/wiki', () => ({
	getWikiSettings,
	getWikiStatus,
	runWiki,
	cancelWiki,
	saveWikiSettings,
}));

const query = jest.fn();
const command = jest.fn();
const commandWithEvent = jest.fn();

jest.mock('../../../../src/main/ipc/core/trusted', () => ({
	TrustedRenderer: class {
		query = query;
		command = command;
		commandWithEvent = commandWithEvent;
	},
}));

import type { EventBus } from '../../../../src/main/event_bus';
import { WikiIpc } from '../../../../src/main/ipc/wiki';
import { WikiChannels } from '../../../../src/shared/ipc_channels_definitions';

describe('WikiIpc', () => {
	it('registers a separate typed wiki API', async () => {
		new WikiIpc().register({ windows: {} as never, apps: {} as never }, {} as EventBus);

		expect(query).toHaveBeenCalledWith(WikiChannels.getSettings, expect.any(Function));
		expect(query).toHaveBeenCalledWith(WikiChannels.getStatus, expect.any(Function));
		expect(command).toHaveBeenCalledWith(WikiChannels.saveSettings, expect.any(Function));
		expect(command).toHaveBeenCalledWith(WikiChannels.run, expect.any(Function));
		expect(command).toHaveBeenCalledWith(WikiChannels.cancel, expect.any(Function));
		expect(commandWithEvent).toHaveBeenCalledWith(WikiChannels.pickDirectory, expect.any(Function));
		expect(command).toHaveBeenCalledWith(WikiChannels.openDirectory, expect.any(Function));

		const settingsHandler = query.mock.calls.find(
			([channel]) => channel === WikiChannels.getSettings
		)?.[1];
		settingsHandler();
		expect(getWikiSettings).toHaveBeenCalled();

		const runHandler = command.mock.calls.find(([channel]) => channel === WikiChannels.run)?.[1];
		await runHandler();
		expect(runWiki).toHaveBeenCalled();

		const cancelHandler = command.mock.calls.find(
			([channel]) => channel === WikiChannels.cancel
		)?.[1];
		cancelHandler();
		expect(cancelWiki).toHaveBeenCalled();
	});
});
