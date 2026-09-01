import React, { useEffect, useState } from 'react';
import {
	AlertTriangle,
	Download,
	FolderPlus,
	FolderSync,
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
	StorageOperationStatus,
	StorageSyncFolder,
	StorageSyncSettings,
} from '@shared/storage_types';
import { getErrorMessage } from '../../../start/setupConstants';
import {
	SettingsLoadingRows,
	SettingsNotice,
	SettingsPageHeader,
	SettingsPageShell,
	SettingsRow,
} from '../../components';
import { DEFAULT_SYNC_CRON_EXPRESSION, SYNC_INTERVALS } from './constants';

interface StoragePageProps {
	readonly inline?: boolean;
}

const DEFAULT_SETTINGS: StorageSyncSettings = {
	paths: [],
	syncEnabled: false,
	syncCronExpression: DEFAULT_SYNC_CRON_EXPRESSION,
};

const StoragePage: React.FC<StoragePageProps> = ({ inline = false }) => {
	const { t } = useTranslation();
	const [settings, setSettings] = useState<StorageSyncSettings | null>(null);
	const [availableFolders, setAvailableFolders] = useState<StorageSyncFolder[]>([]);
	const [draft, setDraft] = useState<StorageSyncSettings | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [syncStatus, setSyncStatus] = useState<string | null>(null);
	const [savingSync, setSavingSync] = useState(false);
	const [operationStatus, setOperationStatus] = useState<StorageOperationStatus>();
	const [operationStatusLoading, setOperationStatusLoading] = useState(true);
	const [restoreOpen, setRestoreOpen] = useState(false);

	useEffect(() => {
		let cancelled = false;
		const applyOperationStatus = (status: StorageOperationStatus): void => {
			if (cancelled) return;
			setOperationStatus((current) =>
				current && current.revision >= status.revision ? current : status
			);
		};
		const unsubscribe = window.storage.onOperationStatusChanged(applyOperationStatus);
		void Promise.all([
			window.storage.getSettings(),
			window.storage.syncFolders(),
			window.storage.getOperationStatus(),
		]).then(
			([storedSettings, folders, status]) => {
				if (cancelled) return;
				setSettings(storedSettings);
				setAvailableFolders(folders);
				if (status) applyOperationStatus(status);
				setOperationStatusLoading(false);
			},
			(err) => {
				if (cancelled) return;
				setSettings(DEFAULT_SETTINGS);
				setOperationStatusLoading(false);
				setError(getErrorMessage(err, t('settings.storage.errors.load')));
			}
		);
		return () => {
			cancelled = true;
			unsubscribe();
		};
	}, [t]);

	const storage = draft ?? settings;
	const runningOperation = operationStatus?.state === 'running' ? operationStatus : undefined;
	const builtInPaths = new Set(availableFolders.map((folder) => folder.path));
	const customPaths = storage?.paths.filter((entry) => !builtInPaths.has(entry)) ?? [];
	const intervalValue = !storage?.syncEnabled
		? 'off'
		: (SYNC_INTERVALS.find((interval) => interval.cron === storage.syncCronExpression)?.key ??
			'custom');
	const busy = operationStatusLoading || savingSync || Boolean(runningOperation);
	const operationStatusKey = operationStatus
		? operationStatus.state === 'running' && operationStatus.trigger === 'scheduled'
			? `settings.storage.operation.${operationStatus.operation}.scheduledRunning`
			: `settings.storage.operation.${operationStatus.operation}.${operationStatus.state}`
		: undefined;
	const operationStatusText = operationStatusKey
		? t(operationStatusKey, {
				count: operationStatus?.transferred,
				failed: operationStatus?.failed,
				error: operationStatus?.error,
			})
		: undefined;

	const updateDraft = (next: StorageSyncSettings): void => {
		setDraft(next);
		setSyncStatus(null);
	};

	const pickFolders = async (): Promise<void> => {
		if (!storage) return;
		setError(null);
		try {
			const paths = await window.storage.pickFolders();
			if (paths.length > 0) {
				updateDraft({ ...storage, paths: [...new Set([...storage.paths, ...paths])] });
			}
		} catch (err) {
			setError(getErrorMessage(err, t('settings.storage.errors.pickFolders')));
		}
	};

	const saveSync = async (): Promise<StorageSyncSettings | undefined> => {
		if (!storage) return undefined;
		setSavingSync(true);
		setError(null);
		setSyncStatus(null);
		try {
			const saved = await window.storage.saveSettings(storage);
			setSettings(saved);
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
		setError(null);
		setSyncStatus(null);
		try {
			if (!(await saveSync())) return;
			setOperationStatus(await window.storage.backup());
		} catch (err) {
			setError(getErrorMessage(err, t('settings.storage.errors.push')));
		}
	};

	const runRestore = async (): Promise<void> => {
		setRestoreOpen(false);
		setError(null);
		setSyncStatus(null);
		try {
			if (!(await saveSync())) return;
			setOperationStatus(await window.storage.restore());
		} catch (err) {
			setError(getErrorMessage(err, t('settings.storage.errors.pull')));
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
		<SettingsPageShell className={inline ? 'max-w-none p-0 sm:p-0' : undefined}>
			{!inline && (
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

			{!storage ? (
				<div aria-busy="true">
					<SettingsLoadingRows rows={4} />
				</div>
			) : (
				<>
					<Card size="sm" className="gap-0! py-0!" aria-busy={Boolean(runningOperation)}>
						<CardHeader className="border-b border-border/60 py-3">
							<CardTitle>
								<h2 className="text-sm font-medium">{t('settings.storage.sync.title')}</h2>
							</CardTitle>
							<CardDescription className="text-xs">
								{t('settings.storage.sync.description')}
							</CardDescription>
						</CardHeader>

						<CardContent className="p-0!">
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
									<Select value={intervalValue} onValueChange={selectInterval} disabled={busy}>
										<SelectTrigger
											size="sm"
											className="w-56 max-w-full text-xs"
											aria-label={t('settings.storage.autoSync.interval')}
										>
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
											updateDraft({ ...storage, syncCronExpression: event.target.value })
										}
									/>
								}
							/>
						</CardContent>

						<CardFooter className="flex-wrap justify-end gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setRestoreOpen(true)}
								disabled={busy || storage.paths.length === 0}
							>
								<Download className="size-3" />
								{runningOperation?.operation === 'restore'
									? t('settings.storage.pulling')
									: t('settings.storage.restore')}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => void runBackup()}
								disabled={busy || storage.paths.length === 0}
							>
								<Upload className="size-3" />
								{runningOperation?.operation === 'backup'
									? t('settings.storage.pushing')
									: t('settings.storage.backup')}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setDraft(null)}
								disabled={!draft || busy}
							>
								{t('settings.storage.cancel')}
							</Button>
							<Button size="sm" onClick={() => void saveSync()} disabled={!draft || busy}>
								<Save className="size-3" />
								{savingSync ? t('settings.storage.saving') : t('settings.storage.sync.save')}
							</Button>
						</CardFooter>
					</Card>

					{syncStatus && <SettingsNotice icon={FolderSync}>{syncStatus}</SettingsNotice>}
					{operationStatusText && (
						<div
							role={operationStatus?.state === 'failed' ? 'alert' : 'status'}
							aria-live={operationStatus?.state === 'failed' ? 'assertive' : 'polite'}
							aria-atomic="true"
						>
							<SettingsNotice
								icon={operationStatus?.state === 'failed' ? AlertTriangle : FolderSync}
								variant={operationStatus?.state === 'failed' ? 'destructive' : 'default'}
							>
								{operationStatusText}
							</SettingsNotice>
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
