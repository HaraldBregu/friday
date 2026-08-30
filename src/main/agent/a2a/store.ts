import path from 'node:path';
import Store from 'electron-store';
import { userDataLocation } from '../../shared/user_data_location';
import type { A2aAgent } from '../../../shared/a2a_types';
import { openA2aAgent } from './open';
import { restrictA2aStorePermissions } from './permissions';
import { sealA2aAgent } from './seal';
import type { A2aStoredAgent } from './stored';

const store = new Store<{ agents: A2aStoredAgent[] }>({
	name: 'a2a',
	cwd: path.resolve(userDataLocation(), 'settings'),
	accessPropertiesByDotNotation: false,
	defaults: { agents: [] },
});

let volatileCredentials = new Map<string, string>();

export const a2aStorePath = store.path;
export const getA2aAgents = (): A2aAgent[] => {
	let hasPlaintextCredential = false;
	const agents = store.get('agents').map((record) => {
		const opened = openA2aAgent(record, volatileCredentials.get(record.id));
		hasPlaintextCredential ||= opened.hasPlaintextCredential;
		return opened.agent;
	});
	if (hasPlaintextCredential) setA2aAgents(agents);
	return structuredClone(agents);
};
export const setA2aAgents = (agents: A2aAgent[]): void => {
	const nextVolatileCredentials = new Map<string, string>();
	const records = agents.map((agent) => {
		const sealed = sealA2aAgent(agent);
		if (sealed.volatileCredential) nextVolatileCredentials.set(agent.id, sealed.volatileCredential);
		return sealed.record;
	});
	volatileCredentials = nextVolatileCredentials;
	store.set('agents', records);
	restrictA2aStorePermissions(store.path);
};
