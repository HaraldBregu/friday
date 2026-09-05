import type { WikiStatus } from '../../../../shared/wiki_types';
import { getWikiState } from './wiki_get_state';
import { getWikiRepository } from './wiki_repository';
import { wikiRuntime } from './wiki_runtime';
import { wikiSettingsStore } from './wiki_settings_store';

export function getWikiStatus(): WikiStatus {
	const nextRun = wikiRuntime.task?.getNextRun();
	const settings = wikiSettingsStore.store;
	const repository = getWikiRepository(settings.targetPath);
	return {
		running: Boolean(wikiRuntime.run),
		enabled: settings.enabled === true,
		lastRun: getWikiState(settings.targetPath).lastRun,
		nextRunAt: nextRun?.toISOString(),
		settingsPath: wikiSettingsStore.path,
		pendingReviews: repository.reviews.store.items.filter((item) => item.status === 'pending')
			.length,
		progress: wikiRuntime.progress,
	};
}
