import { useTranslation } from 'react-i18next';
import { useLocation, useMatch } from 'react-router-dom';
import { getChannelCatalogEntry } from '../../../../../shared';
import { SETTINGS_MODEL_SERVICE_ITEMS, SETTINGS_NAVIGATION } from '../navigation';
import { getSystemMedia } from '../pages/system/detail/media';

interface SettingsBreadcrumbItem {
	readonly label: string;
	readonly path?: string;
}

const ASSISTANT_SUBPAGE_LABEL_KEYS: Record<string, string> = {
	'/settings/assistant/chathistory': 'settings.chatHistory.title',
	'/settings/assistant/data': 'settings.dataControls.title',
	'/settings/assistant/health': 'settings.tabs.health',
	'/settings/assistant/rag': 'settings.rag.title',
	'/settings/assistant/llm-wiki': 'settings.wiki.title',
	'/settings/assistant/permissions': 'settings.tabs.permissions',
	'/settings/a2a': 'settings.tabs.a2a',
};

export function useSettingsBreadcrumbItems(): readonly SettingsBreadcrumbItem[] {
	const { t } = useTranslation();
	const location = useLocation();
	const mcpDetailMatch = useMatch('/settings/providers/mcp/:mcpServerId');
	const extensionDetailMatch = useMatch('/settings/extensions/:extensionId');

	if (location.pathname === '/settings') return [];
	if (location.pathname === '/settings/general/persona') {
		return [
			{ label: t('settings.tabs.general'), path: '/settings/general' },
			{ label: t('settings.persona.title') },
		];
	}
	const assistantSubpageLabelKey = ASSISTANT_SUBPAGE_LABEL_KEYS[location.pathname];
	if (assistantSubpageLabelKey) {
		const assistantItem = SETTINGS_MODEL_SERVICE_ITEMS.find((item) => item.id === 'assistant');
		return [
			{
				label: assistantItem
					? t(assistantItem.labelKey)
					: t('settings.modelServices.assistantName'),
				path: '/settings/assistant',
			},
			{ label: t(assistantSubpageLabelKey) },
		];
	}

	const serviceItem = SETTINGS_MODEL_SERVICE_ITEMS.find((item) => item.path === location.pathname);
	if (serviceItem) {
		if (serviceItem.path.startsWith('/settings/providers/')) {
			return [
				{ label: t('settings.tabs.providers'), path: '/settings/providers' },
				{ label: t(serviceItem.labelKey) },
			];
		}
		return [{ label: t(serviceItem.labelKey) }];
	}

	if (location.pathname === '/settings/providers/keys') {
		return [
			{ label: t('settings.tabs.providers'), path: '/settings/providers' },
			{ label: t('settings.providers.apiKeysTitle') },
		];
	}

	if (mcpDetailMatch) {
		return [
			{ label: t('settings.tabs.mcp'), path: '/settings/providers/mcp' },
			{ label: mcpDetailMatch.params.mcpServerId ?? '' },
		];
	}

	if (extensionDetailMatch) {
		return [
			{ label: t('settings.tabs.extensions'), path: '/settings/extensions' },
			{ label: extensionDetailMatch.params.extensionId ?? '' },
		];
	}

	const current = SETTINGS_NAVIGATION.filter(
		(item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
	).sort((a, b) => b.path.length - a.path.length)[0];
	if (!current) return [];

	const items: SettingsBreadcrumbItem[] = [{ label: t(current.labelKey) }];

	if (location.pathname.startsWith('/settings/tasks/') && location.pathname.endsWith('/detail')) {
		items[0] = { ...items[0], path: current.path };
		items.push({ label: t('settings.cron.detail.title') });
	}

	if (location.pathname.startsWith('/settings/channels/channelDetail/')) {
		const channelId = decodeURIComponent(location.pathname.split('/').at(-1) ?? '');
		const channelLabel = getChannelCatalogEntry(channelId)?.label ?? channelId;
		items[0] = { ...items[0], path: current.path };
		items.push({ label: channelLabel });
	}

	if (location.pathname.startsWith('/settings/skills/skilldetails/')) {
		const skillId = decodeURIComponent(location.pathname.split('/').at(-1) ?? '');
		items[0] = { ...items[0], path: current.path };
		items.push({ label: skillId });
	}

	if (location.pathname.startsWith('/settings/system/media/')) {
		const media = getSystemMedia(decodeURIComponent(location.pathname.split('/').at(-1) ?? ''));
		items[0] = { ...items[0], path: current.path };
		items.push({ label: media ? t(media.titleKey) : t('settings.tabs.system') });
	}

	return items;
}
