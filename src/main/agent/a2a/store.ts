import path from 'node:path';
import Store from 'electron-store';
import { userDataLocation } from '../../shared/user_data_location';
import type { A2aAgent } from '../../../shared/a2a_types';

const store = new Store<{ agents: A2aAgent[] }>({
	name: 'a2a',
	cwd: path.resolve(userDataLocation(), 'settings'),
	accessPropertiesByDotNotation: false,
	defaults: { agents: [] },
});

export const a2aStorePath = store.path;
export const getA2aAgents = (): A2aAgent[] => structuredClone(store.get('agents'));
export const setA2aAgents = (agents: A2aAgent[]): void => store.set('agents', agents);
