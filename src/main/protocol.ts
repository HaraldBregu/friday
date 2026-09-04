import { app, BrowserWindow, desktopCapturer, net, protocol, session } from 'electron';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveWorkspaceFile } from './ipc/workspace';
import { agentLocation } from './shared/agent_location';
import type { LoggerService } from './shared';
import type { AppRegistry } from './apps/app_registry';
import { appsRoot } from './apps/app_root';
import { isAppId } from './apps/app_id';

const LOCAL_RESOURCE_SCHEME = 'local-resource';
export const APP_RESOURCE_SCHEME = 'kucedr-app';
export const APP_SESSION_PARTITION = 'persist:kucedr-apps';

export function registerLocalResourceProtocolScheme(): void {
	protocol.registerSchemesAsPrivileged([
		{
			scheme: LOCAL_RESOURCE_SCHEME,
			privileges: {
				standard: true,
				secure: true,
				bypassCSP: true,
				supportFetchAPI: true,
				stream: true,
			},
		},
		{
			scheme: APP_RESOURCE_SCHEME,
			privileges: {
				standard: true,
				secure: true,
				corsEnabled: true,
				supportFetchAPI: true,
				stream: true,
			},
		},
	]);
}

export function appResourceUrl(file: string, appId: string): string {
	if (!isAppId(appId)) throw new Error('Invalid app ID.');
	const root = path.resolve(appsRoot(), appId);
	const target = path.resolve(file);
	const relative = path.relative(root, target);
	if (!relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
		throw new Error('App entry resolves outside its folder.');
	}
	const url = new URL(`${APP_RESOURCE_SCHEME}://${appId}`);
	url.pathname = `/${relative.split(path.sep).join('/')}`;
	return url.toString();
}

export function registerLocalResourceProtocolHandler(logger: Pick<LoggerService, 'error'>): void {
	const handler =
		(allowAbsolutePaths: boolean) =>
		async (request: Request): Promise<Response> => {
			try {
				const url = new URL(request.url);
				if (url.host !== 'agent' && (url.host !== 'file' || !allowAbsolutePaths)) {
					return new Response(null, { status: 403 });
				}
				let pathname = decodeURIComponent(url.pathname);
				if (url.host === 'agent') {
					pathname = await resolveWorkspaceFile(agentLocation(), pathname.replace(/^\/+/, ''));
				} else if (process.platform === 'win32' && /^\/[A-Za-z]:/.test(pathname)) {
					pathname = pathname.slice(1);
				}
				// Forward headers so media Range requests get 206 responses for seeking.
				return await net.fetch(pathToFileURL(pathname).toString(), {
					headers: request.headers,
				});
			} catch (err) {
				logger.error('App', `${LOCAL_RESOURCE_SCHEME} fetch failed for ${request.url}`, err);
				return new Response(null, { status: 500 });
			}
		};

	protocol.handle(LOCAL_RESOURCE_SCHEME, handler(true));
	const appSession = session.fromPartition(APP_SESSION_PARTITION);
	appSession.protocol.handle(LOCAL_RESOURCE_SCHEME, handler(false));
	appSession.protocol.handle(APP_RESOURCE_SCHEME, async (request) => {
		try {
			const url = new URL(request.url);
			if (!isAppId(url.host)) return new Response(null, { status: 403 });
			const root = path.resolve(appsRoot(), url.host);
			const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '');
			const target = path.resolve(root, pathname);
			const lexicalRelative = path.relative(root, target);
			if (
				!pathname ||
				lexicalRelative.startsWith(`..${path.sep}`) ||
				path.isAbsolute(lexicalRelative)
			) {
				return new Response(null, { status: 403 });
			}
			const resolvedRoot = await fs.realpath(root);
			const resolvedTarget = await fs.realpath(target);
			const relative = path.relative(resolvedRoot, resolvedTarget);
			if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
				return new Response(null, { status: 403 });
			}
			return await net.fetch(pathToFileURL(resolvedTarget).toString(), {
				headers: request.headers,
			});
		} catch (err) {
			logger.error('Apps', `App resource fetch failed for ${request.url}`, err);
			return new Response(null, { status: 404 });
		}
	});
}

export function setupMediaPermissionHandlers(appRegistry: AppRegistry): void {
	const configure = (targetSession: Electron.Session, allowDisplayCapture: boolean): void => {
		targetSession.setPermissionCheckHandler(
			(webContents, permission, requestingOrigin, details) => {
				const isAppContents = isAppWindowWebContents(webContents, appRegistry);
				if (permission === 'fullscreen')
					return Boolean(webContents && appRegistry.has(webContents));
				if (permission === 'clipboard-read' || permission === 'clipboard-sanitized-write') {
					return Boolean(
						details.isMainFrame &&
						(permission === 'clipboard-sanitized-write'
							? isAppContents
							: webContents &&
								!appRegistry.has(webContents) &&
								BrowserWindow.fromWebContents(webContents)) &&
						isTrustedMediaRequestSource(
							requestingOrigin,
							details.requestingUrl,
							details.securityOrigin
						)
					);
				}
				if (permission !== 'media') return false;
				if (details.mediaType !== 'audio' && details.mediaType !== 'video') return false;
				if (!details.isMainFrame) return false;
				if (webContents && appRegistry.has(webContents)) return false;
				if (!webContents || !BrowserWindow.fromWebContents(webContents)) return false;
				return isTrustedMediaRequestSource(
					requestingOrigin,
					details.requestingUrl,
					details.securityOrigin
				);
			}
		);

		targetSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
			if (permission === 'fullscreen') {
				callback(Boolean(webContents && appRegistry.has(webContents)));
				return;
			}
			if (permission === 'clipboard-read' || permission === 'clipboard-sanitized-write') {
				callback(
					Boolean(
						details.isMainFrame &&
						(permission === 'clipboard-sanitized-write'
							? isAppWindowWebContents(webContents, appRegistry)
							: webContents &&
								!appRegistry.has(webContents) &&
								BrowserWindow.fromWebContents(webContents)) &&
						isTrustedMediaRequestSource(undefined, details.requestingUrl, undefined)
					)
				);
				return;
			}
			if (permission !== 'media') {
				callback(false);
				return;
			}

			const mediaDetails = details as Electron.MediaAccessPermissionRequest;
			const requestsAudio = mediaDetails.mediaTypes?.includes('audio') ?? false;
			const requestsVideo = mediaDetails.mediaTypes?.includes('video') ?? false;
			const allowed =
				(requestsAudio || requestsVideo) &&
				mediaDetails.isMainFrame &&
				!appRegistry.has(webContents) &&
				Boolean(webContents && BrowserWindow.fromWebContents(webContents)) &&
				isTrustedMediaRequestSource(
					undefined,
					mediaDetails.requestingUrl,
					mediaDetails.securityOrigin
				);

			callback(allowed);
		});

		targetSession.setDisplayMediaRequestHandler((request, callback) => {
			const trusted = allowDisplayCapture && isTrustedAppRendererUrl(request.frame?.url);
			if (!trusted) {
				callback({});
				return;
			}
			desktopCapturer
				.getSources({ types: ['screen', 'window'] })
				.then((sources) => {
					const source = sources[0];
					callback(source ? { video: source } : {});
				})
				.catch(() => callback({}));
		});
	};

	configure(session.defaultSession, true);
	configure(session.fromPartition(APP_SESSION_PARTITION), false);
}

function rendererDevOrigin(): string | null {
	const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
	if (!rendererUrl) return null;

	try {
		return new URL(rendererUrl).origin;
	} catch {
		return null;
	}
}

function isTrustedRendererOrigin(origin?: string): boolean {
	if (!origin) return false;
	if (origin === 'file://') return true;
	try {
		if (new URL(origin).protocol === `${APP_RESOURCE_SCHEME}:`) return true;
	} catch {
		return false;
	}
	const devOrigin = rendererDevOrigin();
	return Boolean(devOrigin && origin === devOrigin);
}

function isTrustedRendererUrl(url?: string): boolean {
	if (!url) return false;
	if (url.startsWith('file://')) return true;

	try {
		const parsed = new URL(url);
		return (
			parsed.protocol === `${APP_RESOURCE_SCHEME}:` || isTrustedRendererOrigin(parsed.origin)
		);
	} catch {
		return false;
	}
}

export function isTrustedAppRendererUrl(url?: string): boolean {
	if (!url) return false;
	const devOrigin = rendererDevOrigin();
	try {
		const parsed = new URL(url);
		if (devOrigin && parsed.origin === devOrigin) return true;
		if (parsed.protocol !== 'file:') return false;
		return (
			path.resolve(fileURLToPath(parsed)) ===
			path.resolve(app.getAppPath(), 'out/renderer/index.html')
		);
	} catch {
		return false;
	}
}

function isAppWindowWebContents(
	webContents: Electron.WebContents | null,
	appRegistry: AppRegistry
): boolean {
	return Boolean(
		webContents &&
		(BrowserWindow.fromWebContents(webContents) || appRegistry.has(webContents))
	);
}

function isTrustedMediaRequestSource(
	requestingOrigin: string | undefined,
	requestingUrl: string | undefined,
	securityOrigin: string | undefined
): boolean {
	return (
		isTrustedRendererOrigin(requestingOrigin) ||
		isTrustedRendererOrigin(securityOrigin) ||
		isTrustedRendererUrl(requestingUrl)
	);
}
