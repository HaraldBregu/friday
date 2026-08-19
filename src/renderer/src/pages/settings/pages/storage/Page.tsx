import React, { useEffect, useState, type ReactNode } from 'react';
import {
	AlertTriangle,
	Download,
	FolderPlus,
	FolderSync,
	Plus,
	Save,
	Trash2,
	Upload,
} from 'lucide-react';
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { DEFAULT_SYNC_CRON_EXPRESSION, SYNC_INTERVALS } from './constants';

const BLANK_STORAGE: StorageConfig = {
	id: '',
	name: '',
	endpoint: '',
	region: 'us-east-1',
	accessKeyId: '',
	secretAccessKey: '',
	bucket: '',
	forcePathStyle: false,
	paths: [],
	syncEnabled: false,
	syncCronExpression: DEFAULT_SYNC_CRON_EXPRESSION,
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

type RunningAction = 'backup' | 'restore' | null;

const StoragePage: React.FC<StoragePageProps> = ({
	embedded = false,
	inline = false,
	emptyAction,
}) => {
	const { t } = useTranslation();
	const [entries, setEntries] = useState<StorageEntry[] | null>(null);
	const [availableFolders, setAvailableFolders] = useState<StorageSyncFolder[]>([]);
	const [selection, setSelection] = useState<StorageConfiguration | null>(null);
	const [draft, setDraft] = useState<StorageConfig | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [syncStatus, setSyncStatus] = useState<string | null>(null);
	const [savingSync, setSavingSync] = useState(false);
	const [runningAction, setRunningAction] = useState<RunningAction>(null);
	const [restoreOpen, setRestoreOpen] = useState(false);

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
				setSelection(configuration);
			},
			(err) => {
				if (cancelled) return;
				setEntries([]);
				setSelection({
					providerId: undefined,
					storageId: undefined,
					paths: [],
					syncEnabled: false,
					syncCronExpression: DEFAULT_SYNC_CRON_EXPRESSION,
				});
				setError(getErrorMessage(err, t('settings.storage.errors.load')));
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
	const selectedId = savedEntries.some((entry) => entry.storage.id === selection?.providerId)
		? selection?.providerId
		: savedEntries[0]?.storage.id;
	const selectedStorage = savedEntries.find((entry) => entry.storage.id === selectedId)?.storage;
	const storage = draft ?? selectedStorage;
	const builtInPaths = new Set(availableFolders.map((folder) => folder.path));
	const customPaths = storage?.paths.filter((entry) => !builtInPaths.has(entry)) ?? [];
	const intervalValue = !storage?.syncEnabled
		? 'off'
		: (SYNC_INTERVALS.find((interval) => interval.cron === storage.syncCronExpression)?.key ??
			'custom');
	const busy = savingSync || runningAction !== null;

	const updateDraft = (next: StorageConfig): void => {
		setDraft(next);
		setSyncStatus(null);
	};

	const cancelEdits = (): void => {
		setDraft(null);
		setSyncStatus(null);
		setError(null);
	};

	const pickFolders = async (): Promise<void> => {
		if (!storage) return;
		setError(null);
		try {
			const paths = await window.storage.pickFolders();
			if (paths.length === 0) return;
			updateDraft({ ...storage, paths: [...new Set([...storage.paths, ...paths])] });
		} catch (err) {
			setError(getErrorMessage(err, t('settings.storage.errors.pickFolders')));
		}
	};

	const saveSync = async (): Promise<StorageConfig | undefined> => {
		if (!storage) return undefined;
		setSavingSync(true);
		setError(null);
		setSyncStatus(null);
		try {
			const saved = await window.storage.saveStorageConfig(storage);
			setEntries(
				(current) =>
					current?.map((entry) =>
						entry.storage.id === saved.id ? { ...entry, storage: saved } : entry
					) ?? current
			);
			const selected = await window.storage.saveStorageConfiguration({
				providerId: saved.id,
				storageId: selection?.storageId,
				paths: saved.paths,
				syncEnabled: saved.syncEnabled,
				syncCronExpression: saved.syncCronExpression,
			});
			setSelection(selected);
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

	const runBackup = async (): Promise<void> => {
		setRunningAction('backup');
		setError(null);
		setSyncStatus(null);
		try {
			const saved = await saveSync();
			if (!saved) return;
			const result = await window.storage.backup(saved.id);
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
			setRunningAction(null);
		}
	};

	const runRestore = async (): Promise<void> => {
		setRunningAction('restore');
		setRestoreOpen(false);
		setError(null);
		setSyncStatus(null);
		try {
			const saved = await saveSync();
			if (!saved) return;
			const result = await window.storage.restore(saved.id);
			setSyncStatus(
				result.failed.length > 0
					? t('settings.storage.pullPartial', {
							downloaded: result.downloaded.length,
							failed: result.failed.length,
						})
					: t('settings.storage.pullOk', { count: result.downloaded.length })
			);
		} catch (err) {
			setError(getErrorMessage(err, t('settings.storage.errors.pull')));
		} finally {
			setRunningAction(null);
		}
	};

	const selectProvider = async (value: string | null): Promise<void> => {
		const next = savedEntries.find((entry) => entry.storage.id === value)?.storage;
		if (!next) return;
		setDraft(null);
		setSyncStatus(null);
		setError(null);
		try {
			setSelection(
				await window.storage.saveStorageConfiguration({
					providerId: next.id,
					storageId: undefined,
					paths: next.paths,
					syncEnabled: next.syncEnabled,
					syncCronExpression: next.syncCronExpression,
				})
			);
		} catch (err) {
			setError(getErrorMessage(err, t('settings.storage.errors.selectProfile')));
		}
	};

	const selectInterval = (value: string | null): void => {
		if (!storage || !value) return;
		if (value === 'off') {
			updateDraft({ ...storage, syncEnabled: false });
			return;
		}
		const cron = SYNC_INTERVALS.find((interval) => interval.key === value)?.cron;
		updateDraft({
			...storage,
			syncEnabled: true,
			syncCronExpression: cron ?? storage.syncCronExpression,
		});
	};

	return (
		<SettingsPageShell className={embedded || inline ? 'max-w-none p-0 sm:p-0' : undefined}>
			{!embedded && !inline && (
				<SettingsPageHeader
					title={t('settings.storage.configurationTitle')}
					description={t('settings.storage.description')}
				/>
			)}

			{error && (
				<div role="alert">
					<SettingsNotice variant="destructive" icon={AlertTriangle}>
						{error}
					</SettingsNotice>
				</div>
			)}

			{!entries ? (
				<div aria-busy="true">
					<SettingsLoadingRows rows={4} />
				</div>
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
					<Card size="sm" className="gap-0! py-0!" aria-busy={busy}>
						<CardHeader className="border-b border-border/60 py-3">
							<CardTitle>
								<h2 className="text-sm font-medium">{t('settings.storage.cardTitle')}</h2>
							</CardTitle>
							<CardDescription className="text-xs">
								{t('settings.storage.sync.description')}
							</CardDescription>
						</CardHeader>

						<CardContent className="p-0!">
							<SettingsRow
								title={t('settings.storage.profile.label')}
								description={t('settings.storage.profile.help')}
								actions={
									<Select
										value={selectedId ?? ''}
										onValueChange={(value) => void selectProvider(value)}
										disabled={busy}
									>
										<SelectTrigger
											size="sm"
											className="w-56 max-w-full text-xs"
											aria-label={t('settings.storage.profile.label')}
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{savedEntries.map((entry) => (
												<SelectItem key={entry.storage.id} value={entry.storage.id}>
													{entry.storage.name || entry.storage.bucket || entry.storage.id}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								}
							/>

							{storage && (
								<>
									{availableFolders.map((folder) => (
										<SettingsRow
											key={folder.path}
											title={t(`settings.storage.folders.${folder.key}`)}
											description={folder.path}
											className="grid-cols-[minmax(0,1fr)_auto]"
											actionClassName="ml-auto w-auto justify-end"
											actions={
												<Switch
													checked={storage.paths.includes(folder.path)}
													aria-label={t(`settings.storage.folders.${folder.key}`)}
													disabled={busy}
													onCheckedChange={(checked) =>
														updateDraft({
															...storage,
															paths: checked
																? [...new Set([...storage.paths, folder.path])]
																: storage.paths.filter((entry) => entry !== folder.path),
														})
													}
												/>
											}
										/>
									))}

									{customPaths.map((selectedPath) => (
										<SettingsRow
											key={selectedPath}
											title={t('settings.storage.sync.folder')}
											description={selectedPath}
											className="grid-cols-[minmax(0,1fr)_auto] [&_p]:break-all"
											actionClassName="ml-auto w-auto justify-end"
											actions={
												<Button
													variant="ghost"
													size="icon-sm"
													aria-label={t('settings.storage.sync.removeFolder')}
													disabled={busy}
													onClick={() =>
														updateDraft({
															...storage,
															paths: storage.paths.filter((entry) => entry !== selectedPath),
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
											disabled={busy}
										>
											<FolderPlus className="size-3" />
											{t('settings.storage.sync.addFolders')}
										</Button>
									</div>

									<SettingsRow
										title={t('settings.storage.autoSync.interval')}
										description={t('settings.storage.autoSync.description')}
										actions={
											<Select
												value={intervalValue}
												onValueChange={selectInterval}
												disabled={busy}
											>
												<SelectTrigger
													size="sm"
													className="w-56 max-w-full text-xs"
													aria-label={t('settings.storage.autoSync.interval')}
												>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="off">
														{t('settings.storage.autoSync.off')}
													</SelectItem>
													{SYNC_INTERVALS.map((interval) => (
														<SelectItem key={interval.key} value={interval.key}>
															{t(`settings.storage.autoSync.${interval.key}`)}
														</SelectItem>
													))}
													{intervalValue === 'custom' && (
														<SelectItem value="custom">
															{t('settings.storage.autoSync.custom')}
														</SelectItem>
													)}
												</SelectContent>
											</Select>
										}
									/>

									<SettingsRow
										title={t('settings.storage.autoSync.cronExpression')}
										description={t('settings.storage.autoSync.cronDescription')}
										actions={
											<Input
												value={storage.syncCronExpression}
												aria-label={t('settings.storage.autoSync.cronExpression')}
												className="w-56 max-w-full font-mono text-xs"
												disabled={!storage.syncEnabled || busy}
												onChange={(event) =>
													updateDraft({
														...storage,
														syncCronExpression: event.target.value,
													})
												}
											/>
										}
									/>
								</>
							)}
						</CardContent>

						<CardFooter className="flex-wrap justify-end gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setRestoreOpen(true)}
								disabled={busy || !storage || storage.paths.length === 0}
							>
								<Download className="size-3" />
								{runningAction === 'restore'
									? t('settings.storage.pulling')
									: t('settings.storage.restore')}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => void runBackup()}
								disabled={busy || !storage || storage.paths.length === 0}
							>
								<Upload className="size-3" />
								{runningAction === 'backup'
									? t('settings.storage.pushing')
									: t('settings.storage.backup')}
							</Button>
							<Button variant="ghost" size="sm" onClick={cancelEdits} disabled={!draft || busy}>
								{t('settings.storage.cancel')}
							</Button>
							<Button size="sm" onClick={() => void saveSync()} disabled={!draft || busy}>
								<Save className="size-3" />
								{savingSync ? t('settings.storage.saving') : t('settings.storage.sync.save')}
							</Button>
						</CardFooter>
					</Card>

					{syncStatus && (
						<div role="status" aria-live="polite">
							<SettingsNotice icon={FolderSync}>{syncStatus}</SettingsNotice>
						</div>
					)}

					<Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{t('settings.storage.restoreDialog.title')}</DialogTitle>
								<DialogDescription>
									{t('settings.storage.restoreDialog.description')}
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button variant="outline" onClick={() => setRestoreOpen(false)}>
									{t('settings.storage.cancel')}
								</Button>
								<Button onClick={() => void runRestore()}>
									<Download className="size-3" />
									{t('settings.storage.restoreDialog.confirm')}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</>
			)}
		</SettingsPageShell>
	);
};

export default StoragePage;
