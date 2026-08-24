import { contextBridge } from 'electron';
import { agent } from './agent';
import { coder } from './coder';
import { a2a } from './a2a';
import { app } from './app';
import { recorder } from './recorder';
import { tasks } from './tasks';
import { mcp } from './mcp';
import { models } from './models';
import { provider } from './provider';
import { search } from './search';
import { skills } from './skills';
import { storage } from './storage';
import { database } from './database';
import { extensions } from './extensions';
import { wiki } from './wiki';
import { win } from './win';
import { data } from './data';
import { terminalAPI } from './terminal';

export { agent } from './agent';
export { coder } from './coder';
export { a2a } from './a2a';
export { app } from './app';
export { recorder } from './recorder';
export { tasks } from './tasks';
export { mcp } from './mcp';
export { models } from './models';
export { provider } from './provider';
export { search } from './search';
export { skills } from './skills';
export { storage } from './storage';
export { database } from './database';
export { extensions } from './extensions';
export { wiki } from './wiki';
export { data } from './data';
export { terminalAPI } from './terminal';

if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('app', app);
		contextBridge.exposeInMainWorld('win', win);
		contextBridge.exposeInMainWorld('agent', agent);
		contextBridge.exposeInMainWorld('coder', coder);
		contextBridge.exposeInMainWorld('a2a', a2a);
		contextBridge.exposeInMainWorld('recorder', recorder);
		contextBridge.exposeInMainWorld('tasks', tasks);
		contextBridge.exposeInMainWorld('skills', skills);
		contextBridge.exposeInMainWorld('mcp', mcp);
		contextBridge.exposeInMainWorld('models', models);
		contextBridge.exposeInMainWorld('storage', storage);
		contextBridge.exposeInMainWorld('database', database);
		contextBridge.exposeInMainWorld('provider', provider);
		contextBridge.exposeInMainWorld('search', search);
		contextBridge.exposeInMainWorld('extensions', extensions);
		contextBridge.exposeInMainWorld('wiki', wiki);
		contextBridge.exposeInMainWorld('dataControls', data);
		contextBridge.exposeInMainWorld('terminalAPI', terminalAPI);
	} catch (error) {
		console.error('[preload] Failed to expose IPC APIs:', error);
	}
} else {
	// @ts-ignore (define in dts)
	globalThis.app = app;
	// @ts-ignore (define in dts)
	globalThis.win = win;
	// @ts-ignore (define in dts)
	globalThis.agent = agent;
	// @ts-ignore (define in dts)
	globalThis.coder = coder;
	// @ts-ignore (define in dts)
	globalThis.a2a = a2a;
	// @ts-ignore (define in dts)
	globalThis.recorder = recorder;
	// @ts-ignore (define in dts)
	globalThis.tasks = tasks;
	// @ts-ignore (define in dts)
	globalThis.skills = skills;
	// @ts-ignore (define in dts)
	globalThis.mcp = mcp;
	// @ts-ignore (define in dts)
	globalThis.models = models;
	// @ts-ignore (define in dts)
	globalThis.storage = storage;
	// @ts-ignore (define in dts)
	globalThis.database = database;
	// @ts-ignore (define in dts)
	globalThis.provider = provider;
	// @ts-ignore (define in dts)
	globalThis.search = search;
	// @ts-ignore (define in dts)
	globalThis.extensions = extensions;
	// @ts-ignore (define in dts)
	globalThis.wiki = wiki;
	// @ts-ignore (define in dts)
	globalThis.dataControls = data;
	// @ts-ignore (define in dts)
	globalThis.terminalAPI = terminalAPI;
}
