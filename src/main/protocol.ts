import { app, BrowserWindow, desktopCapturer, net, protocol, session } from 'electron';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { resolveWorkspaceFile } from './ipc/workspace';
import { agentLocation } from './shared/agent_location';
import type { LoggerService } from './shared';
import type { ExtensionRegistry } from './extensions/extension_registry';

const LOCAL_RESOURCE_SCHEME = 'local-resource';
export const EXTENSION_SESSION_PARTITION = 'persist:friday-extensions';

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
	]);
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
	session
		.fromPartition(EXTENSION_SESSION_PARTITION)
		.protocol.handle(LOCAL_RESOURCE_SCHEME, handler(false));
}

export function setupMediaPermissionHandlers(extensionRegistry: ExtensionRegistry): void {
	const configure = (targetSession: Electron.Session, allowDisplayCapture: boolean): void => {
		targetSession.setPermissionCheckHandler(
			(webContents, permission, requestingOrigin, details) => {
				const isAppContents = isAppWindowWebContents(webContents, extensionRegistry);
				if (permission === 'fullscreen')
					return Boolean(webContents && extensionRegistry.has(webContents));
				if (permission === 'clipboard-read' || permission === 'clipboard-sanitized-write') {
					return Boolean(
						details.isMainFrame &&
						(permission === 'clipboard-sanitized-write'
							? isAppContents
							: webContents && BrowserWindow.fromWebContents(webContents)) &&
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
				callback(Boolean(webContents && extensionRegistry.has(webContents)));
				return;
			}
			if (permission === 'clipboard-read' || permission === 'clipboard-sanitized-write') {
				callback(
					Boolean(
						details.isMainFrame &&
						(permission === 'clipboard-sanitized-write'
							? isAppWindowWebContents(webContents, extensionRegistry)
							: webContents && BrowserWindow.fromWebContents(webContents)) &&
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
				Boolean(webContents && BrowserWindow.fromWebContents(webContents)) &&
				isTrustedMediaRequestSource(
					undefined,
					mediaDetails.requestingUrl,
					mediaDetails.securityOrigin
				);

			callback(allowed);
		});

		targetSession.setDisplayMediaRequestHandler((request, callback) => {
			const trusted = allowDisplayCapture && isTrustedDisplayCaptureUrl(request.frame?.url);
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
	configure(session.fromPartition(EXTENSION_SESSION_PARTITION), false);
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
	const devOrigin = rendererDevOrigin();
	return Boolean(devOrigin && origin === devOrigin);
}

function isTrustedRendererUrl(url?: string): boolean {
	if (!url) return false;
	if (url.startsWith('file://')) return true;

	try {
		return isTrustedRendererOrigin(new URL(url).origin);
	} catch {
		return false;
	}
}

function isTrustedDisplayCaptureUrl(url?: string): boolean {
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
	extensionRegistry: ExtensionRegistry
): boolean {
	return Boolean(
		webContents &&
		(BrowserWindow.fromWebContents(webContents) || extensionRegistry.has(webContents))
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
