import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import { app, BrowserWindow, desktopCapturer, net, protocol, session } from 'electron';
import { ExtensionRegistry } from '../../../../src/main/extensions/extension_registry';
import { extensionsRoot } from '../../../../src/main/extensions/extension_root';
import {
	EXTENSION_RESOURCE_SCHEME,
	EXTENSION_SESSION_PARTITION,
	extensionResourceUrl,
	registerLocalResourceProtocolHandler,
	registerLocalResourceProtocolScheme,
	setupMediaPermissionHandlers,
} from '../../../../src/main/protocol';

describe('protocol security', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(fs, 'realpath').mockImplementation(async (value) => String(value));
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('denies absolute local files to extension sessions', async () => {
		jest.mocked(net.fetch).mockResolvedValue(new Response('ok'));
		registerLocalResourceProtocolHandler({ error: jest.fn() });

		const mainHandler = jest.mocked(protocol.handle).mock.calls[0][1] as (
			request: Request
		) => Promise<Response>;
		const extension = jest.mocked(session.fromPartition).mock.results[0].value as Electron.Session;
		const extensionHandler = jest.mocked(extension.protocol.handle).mock.calls[0][1] as (
			request: Request
		) => Promise<Response>;
		const privatePath = '/tmp/kucedr-private.txt';
		const request = new Request(`local-resource://file${privatePath}`);

		await expect(extensionHandler(request)).resolves.toMatchObject({ status: 403 });
		expect(net.fetch).not.toHaveBeenCalled();

		await mainHandler(request);
		expect(net.fetch).toHaveBeenCalledWith(pathToFileURL(privatePath).toString(), {
			headers: request.headers,
		});
		expect(session.fromPartition).toHaveBeenCalledWith(EXTENSION_SESSION_PARTITION);
	});

	it('serves extension resources only from the selected extension folder', async () => {
		jest.mocked(net.fetch).mockResolvedValue(new Response('ok'));
		registerLocalResourceProtocolScheme();
		registerLocalResourceProtocolHandler({ error: jest.fn() });

		expect(protocol.registerSchemesAsPrivileged).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					scheme: EXTENSION_RESOURCE_SCHEME,
					privileges: expect.objectContaining({ secure: true, standard: true }),
				}),
			])
		);
		const extension = jest.mocked(session.fromPartition).mock.results[0].value as Electron.Session;
		const extensionHandler = jest
			.mocked(extension.protocol.handle)
			.mock.calls.find(([scheme]) => scheme === EXTENSION_RESOURCE_SCHEME)?.[1] as (
			request: Request
		) => Promise<Response>;
		const entry = path.join(extensionsRoot(), 'draw', 'index.html');
		const request = new Request(extensionResourceUrl(entry, 'draw'));

		await expect(extensionHandler(request)).resolves.toMatchObject({ status: 200 });
		expect(net.fetch).toHaveBeenCalledWith(pathToFileURL(entry).toString(), {
			headers: request.headers,
		});
		await expect(
			extensionHandler(new Request(`${EXTENSION_RESOURCE_SCHEME}://draw/..%2F..%2Fprivate.txt`))
		).resolves.toMatchObject({ status: 403 });
		expect(net.fetch).toHaveBeenCalledTimes(1);
	});

	it('keeps sensitive read and capture permissions out of extension views', async () => {
		const extensionRegistry = new ExtensionRegistry();
		const extensionContents = { id: 7, once: jest.fn() };
		extensionRegistry.register(extensionContents, 'workspace');
		const mainContents = { id: 8 };
		jest
			.mocked(BrowserWindow.fromWebContents)
			.mockImplementation((contents) =>
				contents === mainContents ? ({} as Electron.BrowserWindow) : null
			);
		setupMediaPermissionHandlers(extensionRegistry);

		const defaultSession = session.defaultSession;
		const check = jest.mocked(defaultSession.setPermissionCheckHandler).mock.calls[0][0];
		const mainUrl = pathToFileURL(
			path.join(app.getAppPath(), 'out/renderer/index.html')
		).toString();
		const details = {
			isMainFrame: true,
			mediaType: 'audio',
			requestingUrl: mainUrl,
			securityOrigin: 'file://',
		} as Electron.PermissionCheckHandlerHandlerDetails;

		expect(
			check(extensionContents as Electron.WebContents, 'clipboard-read', 'file://', details)
		).toBe(false);
		expect(
			check(
				extensionContents as Electron.WebContents,
				'clipboard-sanitized-write',
				'file://',
				details
			)
		).toBe(true);
		expect(check(extensionContents as Electron.WebContents, 'media', 'file://', details)).toBe(
			false
		);
		expect(check(mainContents as Electron.WebContents, 'media', 'file://', details)).toBe(true);

		const display = jest.mocked(defaultSession.setDisplayMediaRequestHandler).mock.calls[0][0];
		const denied = jest.fn();
		display(
			{ frame: { url: pathToFileURL('/tmp/extension/index.html').toString() } } as never,
			denied
		);
		expect(denied).toHaveBeenCalledWith({});
		expect(desktopCapturer.getSources).not.toHaveBeenCalled();

		jest.mocked(desktopCapturer.getSources).mockResolvedValue([{ id: 'screen:1' }] as never);
		await new Promise<void>((resolve) => {
			display({ frame: { url: mainUrl } } as never, (result) => {
				expect(result).toEqual({ video: { id: 'screen:1' } });
				resolve();
			});
		});
	});
});
