import { useEffect, useState } from 'react';
import {
	app,
	coder,
	type CoderAuthEvent,
	type CoderCatalog,
	type CoderProviderId,
	type CoderSettings,
	type CoderThinkingLevel,
	type CoderToolMode,
} from '@friday/sdk';

export function useConfiguration() {
	const [settings, setSettings] = useState<CoderSettings | null>(null);
	const [catalog, setCatalog] = useState<CoderCatalog>({ providers: [] });
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [connecting, setConnecting] = useState(false);
	const [authEvent, setAuthEvent] = useState<CoderAuthEvent | null>(null);
	const [error, setError] = useState('');

	const refreshCatalog = async (): Promise<void> => setCatalog(await coder.listModels());
	const save = async (next: CoderSettings): Promise<void> => {
		setSettings(next);
		setSaving(true);
		setError('');
		try {
			setSettings(await coder.saveSettings(next));
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Unable to save Coder settings.');
		} finally {
			setSaving(false);
		}
	};

	useEffect(() => {
		let active = true;
		void Promise.all([coder.getSettings(), coder.listModels()])
			.then(([nextSettings, nextCatalog]) => {
				if (!active) return;
				setSettings(nextSettings);
				setCatalog(nextCatalog);
			})
			.catch((reason) => {
				if (active) setError(reason instanceof Error ? reason.message : 'Unable to load settings.');
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, []);

	const setProvider = (providerId: CoderProviderId): void => {
		if (!settings) return;
		const provider = catalog.providers.find((item) => item.id === providerId);
		const modelId = provider?.models.some((model) => model.id === settings.modelId)
			? settings.modelId
			: (provider?.models[0]?.id ?? '');
		void save({ ...settings, providerId, modelId });
	};
	const setModel = (modelId: string): void => {
		if (settings) void save({ ...settings, modelId });
	};
	const setThinking = (thinkingLevel: CoderThinkingLevel): void => {
		if (settings) void save({ ...settings, thinkingLevel });
	};
	const setTools = (toolMode: CoderToolMode): void => {
		if (settings) void save({ ...settings, toolMode });
	};
	const connect = async (): Promise<void> => {
		setConnecting(true);
		setAuthEvent(null);
		setError('');
		try {
			await coder.connectCodex((event) => {
				setAuthEvent(event);
				if (event.type === 'device-code') void app.openExternalUrl(event.verificationUri);
				if (event.type === 'auth-url') void app.openExternalUrl(event.url);
			});
			await refreshCatalog();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Unable to connect Codex.');
		} finally {
			setConnecting(false);
		}
	};
	const disconnect = async (): Promise<void> => {
		setConnecting(true);
		setError('');
		try {
			await coder.disconnectCodex();
			await refreshCatalog();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Unable to disconnect Codex.');
		} finally {
			setConnecting(false);
		}
	};
	const cancelConnect = async (): Promise<void> => {
		await coder.cancelCodexLogin();
	};

	const selectedProvider = catalog.providers.find((item) => item.id === settings?.providerId);
	return {
		authEvent,
		catalog,
		connecting,
		error,
		loading,
		saving,
		settings,
		selectedProvider,
		connect,
		cancelConnect,
		disconnect,
		setModel,
		setProvider,
		setThinking,
		setTools,
	};
}
