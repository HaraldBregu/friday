import React, { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, FolderPlus, FolderSync, Play, Plus, Save, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type {
	StorageConfig,
	StorageConfiguration,
	StorageSyncFolder,
} from '../../../../../../shared/storage_types';
import { getErrorMessage } from '../../../start/constants';
import {
	SettingsLoadingRows,
	SettingsNotice,
	SettingsPageHeader,
	SettingsPageShell,
	SettingsRow,
} from '../../components';
import { ProviderCard } from './ProviderCard';
import { SYNC_INTERVALS } from './constants';

const BLANK_STORAGE: StorageConfig = {
	id: '',
	name: '',
	endpoint: '',
	region: 'us-east-1',
	accessKeyId: '',
	secretAccessKey: '',
	bucket: '',
	forcePathStyle: false,
};

interface StorageEntry {
	key: string;
	storage: StorageConfig;
}

interface StoragePageProps {
	readonly embedded?: boolean;
	readonly inline?: boolean;
	readonly emptyAction?: ReactNode;
}

const StoragePage: React.FC<StoragePageProps> = ({
	embedded = false,
	inline = false,
	emptyAction,
}) => {
	const { t } = useTranslation();
	const [entries, setEntries] = useState<StorageEntry[] | null>(null);
	const [availableFolders, setAvailableFolders] = useState<StorageSyncFolder[]>([]);
	const [config, setConfig] = useState<StorageConfiguration | null>(null);
	const [draft, setDraft] = useState<StorageConfiguration | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [syncStatus, setSyncStatus] = useState<string | null>(null);
	const [savingSync, setSavingSync] = useState(false);
	const [runningSync, setRunningSync] = useState(false);

	useEffect(() => {
		let cancelled = false;
		void Promise.all([
			window.storage.getStorages(),
			window.storage.syncFolders(),
			window.storage.getStorageConfiguration(),
		]).then(
			([storages, folders, configuration]) => {
				if (cancelled) return;
				setEntries(storages.map((storage) => ({ key: storage.id, storage })));
				setAvailableFolders(folders);
				setConfig(configuration);
			},
			(err) => {
				if (!cancelled) setError(getErrorMessage(err, t('settings.storage.errors.load')));
			}
		);
		return () => {
			cancelled = true;
		};
	}, [t]);

	const addProvider = (): void => {
		setEntries((current) => [
			...(current ?? []),
			{ key: crypto.randomUUID(), storage: BLANK_STORAGE },
		]);
	};

	const savedEntries = (entries ?? []).filter((entry) => Boolean(entry.storage.id));
	const configuration = draft ?? config;
	const builtInPaths = new Set(availableFolders.map((folder) => folder.path));
	const customPaths = configuration?.paths.filter((path) => !builtInPaths.has(path)) ?? [];
	const intervalValue = !configuration?.syncEnabled
		? 'off'
		: (SYNC_INTERVALS.find((interval) => interval.cron === configuration.syncCronExpression)?.key ??
			'custom');

	const updateDraft = (next: StorageConfiguration): void => {
		setDraft(next);
		setSyncStatus(null);
	};

	const cancelEdits = (): void => {
		setDraft(null);
		setSyncStatus(null);
		setError(null);
	};

	const pickFolders = async (): Promise<void> => {
		if (!configuration) return;
		setError(null);
		try {
			const paths = await window.storage.pickFolders();
			if (paths.length === 0) return;
			updateDraft({
				...configuration,
				paths: [...new Set([...configuration.paths, ...paths])],
			});
		} catch (err) {
			setError(getErrorMessage(err, t('settings.storage.errors.pickFolders')));
		}
	};

	const saveSync = async (): Promise<StorageConfiguration | undefined> => {
		if (!configuration) return undefined;
		setSavingSync(true);
		setError(null);
		setSyncStatus(null);
		try {
			const saved = await window.storage.saveStorageConfiguration(configuration);
			setConfig(saved);
			setDraft(null);
			setSyncStatus(t('settings.storage.syncSaved'));
			return saved;
		} catch (err) {
			setError(getErrorMessage(err, t('settings.storage.errors.saveSync')));
			return undefined;
		} finally {
			setSavingSync(false);
		}
	};

	const runSync = async (): Promise<void> => {
		setRunningSync(true);
		setError(null);
		setSyncStatus(null);
		try {
			const saved = await saveSync();
			if (!saved?.providerId) return;
			const result = await window.storage.push(saved.providerId);
			setSyncStatus(
				result.failed.length > 0
					? t('settings.storage.pushPartial', {
							uploaded: result.uploaded.length,
							failed: result.failed.length,
						})
					: t('settings.storage.pushOk', { count: result.uploaded.length })
			);
		} catch (err) {
			setError(getErrorMessage(err, t('settings.storage.errors.push')));
		} finally {
			setRunningSync(false);
		}
	};

	const selectProvider = (value: string | null): void => {
		if (!configuration || !value) return;
		updateDraft({ ...configuration, providerId: value });
	};

	const selectInterval = (value: string | null): void => {
		if (!configuration || !value) return;
		if (value === 'off') {
			updateDraft({ ...configuration, syncEnabled: false });
			return;
		}
		const cron = SYNC_INTERVALS.find((interval) => interval.key === value)?.cron;
		updateDraft({
			...configuration,
			syncEnabled: true,
			syncCronExpression: cron ?? configuration.syncCronExpression,
		});
	};

	return (
		<SettingsPageShell className={embedded || inline ? 'max-w-none p-0' : undefined}>
			{!embedded && !inline && (
				<SettingsPageHeader
					title={t('settings.storage.configurationTitle')}
					description={t('settings.storage.description')}
				/>
			)}

			{error && (
				<SettingsNotice variant="destructive" icon={AlertTriangle}>
					{error}
				</SettingsNotice>
			)}

			{!entries ? (
				<SettingsLoadingRows rows={4} />
			) : embedded ? (
				<>
					{entries.length === 0 && <SettingsNotice>{t('settings.storage.empty')}</SettingsNotice>}

					{entries.map((entry) => (
						<ProviderCard
							key={entry.key}
							storage={entry.storage}
							onSaved={(saved) => {
								setEntries(
									(current) =>
										current?.map((item) =>
											item.key === entry.key ? { ...item, storage: saved } : item
										) ?? current
								);
							}}
							onRemoved={() => {
								setEntries(
									(current) => current?.filter((item) => item.key !== entry.key) ?? current
								);
							}}
						/>
					))}

					<Button variant="outline" size="sm" onClick={addProvider} className="self-start">
						<Plus className="size-3" />
						{t('settings.storage.addProvider')}
					</Button>
				</>
			) : savedEntries.length === 0 ? (
				<>
					<SettingsNotice>{t('settings.storage.empty')}</SettingsNotice>
					{emptyAction}
				</>
			) : (
				<>
					<Card size="sm" className="gap-0! py-0!">
						<CardHeader className="border-b border-border/60 py-3">
							<CardTitle>{t('settings.storage.cardTitle')}</CardTitle>
							<CardDescription className="text-xs">
								{t('settings.storage.sync.description')}
							</CardDescription>
						</CardHeader>

						<CardContent className="p-0!">
							<SettingsRow
								title={t('settings.storage.profile.label')}
								description={t('settings.storage.profile.help')}
								actions={
									<Select value={configuration?.providerId ?? ''} onValueChange={selectProvider}>
										<SelectTrigger size="sm" className="w-56 max-w-full text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{savedEntries.map((entry) => (
												<SelectItem key={entry.storage.id} value={entry.storage.id}>
													{entry.storage.name ||
														entry.storage.bucket ||
														entry.storage.endpoint ||
														entry.storage.id}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								}
							/>

							{configuration && (
								<>
									{availableFolders.map((folder) => (
										<SettingsRow
											key={folder.path}
											title={t(`settings.storage.folders.${folder.key}`)}
											description={folder.path}
											className="grid-cols-[minmax(0,1fr)_auto]"
											actionClassName="w-auto ml-auto justify-end"
											actions={
												<Switch
													checked={configuration.paths.includes(folder.path)}
													aria-label={t(`settings.storage.folders.${folder.key}`)}
													onCheckedChange={(checked) =>
														updateDraft({
															...configuration,
															paths: checked
																? [...new Set([...configuration.paths, folder.path])]
																: configuration.paths.filter((path) => path !== folder.path),
														})
													}
												/>
											}
										/>
									))}

									{customPaths.map((path) => (
										<SettingsRow
											key={path}
											title={t('settings.storage.sync.folder')}
											description={path}
											className="grid-cols-[minmax(0,1fr)_auto]"
											actionClassName="w-auto ml-auto justify-end"
											actions={
												<Button
													variant="ghost"
													size="icon-sm"
													aria-label={t('settings.storage.sync.removeFolder')}
													onClick={() =>
														updateDraft({
															...configuration,
															paths: configuration.paths.filter((entry) => entry !== path),
														})
													}
												>
													<Trash2 className="size-3" />
												</Button>
											}
										/>
									))}

									<div className="border-b border-border/60 px-3 py-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => void pickFolders()}
											disabled={savingSync || runningSync}
										>
											<FolderPlus className="size-3" />
											{t('settings.storage.sync.addFolders')}
										</Button>
									</div>

									<SettingsRow
										title={t('settings.storage.autoSync.interval')}
										description={t('settings.storage.autoSync.description')}
										actions={
											<Select value={intervalValue} onValueChange={selectInterval}>
												<SelectTrigger size="sm" className="w-56 max-w-full text-xs">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="off">{t('settings.storage.autoSync.off')}</SelectItem>
													{SYNC_INTERVALS.map((interval) => (
														<SelectItem key={interval.key} value={interval.key}>
															{t(`settings.storage.autoSync.${interval.key}`)}
														</SelectItem>
													))}
													{intervalValue === 'custom' && (
														<SelectItem value="custom">
															{configuration.syncCronExpression}
														</SelectItem>
													)}
												</SelectContent>
											</Select>
										}
									/>
								</>
							)}
						</CardContent>

						<CardFooter className="justify-end gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => void runSync()}
								disabled={
									savingSync ||
									runningSync ||
									!configuration?.providerId ||
									configuration.paths.length === 0
								}
							>
								<Play className="size-3" />
								{runningSync
									? t('settings.storage.sync.running')
									: t('settings.storage.sync.runNow')}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={cancelEdits}
								disabled={!draft || savingSync || runningSync}
							>
								{t('settings.storage.cancel')}
							</Button>
							<Button
								size="sm"
								onClick={() => void saveSync()}
								disabled={savingSync || runningSync}
							>
								<Save className="size-3" />
								{savingSync ? t('settings.storage.saving') : t('settings.storage.sync.save')}
							</Button>
						</CardFooter>
					</Card>

					{syncStatus && <SettingsNotice icon={FolderSync}>{syncStatus}</SettingsNotice>}
				</>
			)}
		</SettingsPageShell>
	);
};

export default StoragePage;
