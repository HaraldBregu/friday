import type { Tool } from '../../../types';
import { useWebBrowserTool } from '../use_web_browser';
import { browserSessions, type BrowserSession } from './session';

export function createBackgroundBrowser(): { tool: Tool; close(): Promise<void> } {
	const session: BrowserSession = {
		context: null,
		headless: true,
		closed: false,
		pages: new Map(),
		consoleLogs: new Map(),
		nextTabId: 1,
	};
	return {
		tool: {
			...useWebBrowserTool,
			description: 'Open and read web pages in an independent headless Chrome browser. This background run has its own temporary profile, without interactive browser logins. Use open, navigate, snapshot, screenshot, pdf, and tabs without approval. Browser interactions require approval. The browser closes when this run ends.',
			capability: (input) => ({ effects: ['external'], approval: input.action === 'act' }),
			run: (input, signal) => browserSessions.run(session, () => useWebBrowserTool.run(input, signal)),
		},
		async close() {
			session.closed = true;
			await session.starting?.catch(() => undefined);
			await session.context?.close();
		},
	};
}
