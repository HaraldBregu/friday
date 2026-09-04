import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
	AlertTriangle,
	Blocks,
	ChevronRight,
	FolderOpen,
	RefreshCw,
	Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemTitle } from '@/components/ui/item';
import type { Extension } from '../../../../../../shared/extension_types';
import Delete from './Delete';
import {
	SettingsEmptyState,
	SettingsLoadingRows,
	SettingsNotice,
	SettingsPageHeader,
	SettingsPageShell,
	SettingsPanel,
	SettingsSection,
} from '../../components';

function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}
	return fallback;
}

const ExtensionsPage: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [extensions, setExtensions] = useState<Extension[]>([]);
	const [loading, setLoading] = useState(true);
	const [importing, setImporting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	const loadExtensions = useCallback(async (): Promise<void> => {
		setLoading(true);
		setErrorMessage('');
		try {
			setExtensions(await window.extensions.list());
		} catch {
			setErrorMessage(t('settings.extensions.loadError'));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		void loadExtensions();
	}, [loadExtensions]);

	const handleOpenFolder = useCallback(async (): Promise<void> => {
		setErrorMessage('');
		try {
			await window.extensions.openRoot();
		} catch (error) {
			setErrorMessage(getErrorMessage(error, t('settings.extensions.openFolderError')));
		}
	}, [t]);

	const handleImport = useCallback(async (): Promise<void> => {
		setImporting(true);
		setErrorMessage('');
		setSuccessMessage('');
		try {
			const result = await window.extensions.import();
			if (result) {
				setSuccessMessage(
					t('settings.extensions.uploaded', {
						count: String(result.imported.length),
						skipped: String(result.skipped.length),
					})
				);
				await loadExtensions();
			}
		} catch (error) {
			setErrorMessage(getErrorMessage(error, t('settings.extensions.uploadError')));
		} finally {
			setImporting(false);
		}
	}, [loadExtensions, t]);

	const extensionPath = useCallback(
		(extensionId: string): string => `/settings/extensions/${encodeURIComponent(extensionId)}`,
		[]
	);

	return (
		<SettingsPageShell>
			<SettingsPageHeader
				title={t('settings.tabs.extensions')}
				description={t('settings.extensions.description')}
				action={
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							size="icon-xs"
							onClick={() => void handleOpenFolder()}
							disabled={loading || importing}
							aria-label={t('settings.extensions.openFolder')}
							title={t('settings.extensions.openFolder')}
						>
							<FolderOpen className="size-3" />
						</Button>
						<Button
							variant="outline"
							size="xs"
							onClick={loadExtensions}
							disabled={loading || importing}
						>
							<RefreshCw className="size-3" />
							{t('settings.extensions.refresh')}
						</Button>
						<Button size="xs" onClick={() => void handleImport()} disabled={loading || importing}>
							<Upload className="size-3" />
							{importing ? t('settings.extensions.uploading') : t('settings.extensions.upload')}
						</Button>
					</div>
				}
			/>

			{errorMessage && (
				<SettingsNotice variant="destructive" icon={AlertTriangle}>
					{errorMessage}
				</SettingsNotice>
			)}

			{successMessage && <SettingsNotice>{successMessage}</SettingsNotice>}

			<SettingsSection title={t('settings.extensions.title')}>
				<SettingsPanel>
					{loading ? (
						<SettingsLoadingRows rows={2} />
					) : extensions.length === 0 ? (
						<SettingsEmptyState
							icon={Blocks}
							title={t('settings.extensions.empty')}
							description={t('settings.extensions.emptyDescription')}
						/>
					) : (
						extensions.map((extension) => (
							<div
								key={extension.id}
								className="flex items-center border-b border-border/60 hover:bg-muted/40 last:border-b-0"
							>
								<Item
									as="button"
									type="button"
									variant="outline"
									size="md"
									className="min-w-0 flex-1 cursor-pointer pr-2 text-left"
									onClick={() => navigate(extensionPath(extension.id))}
								>
									<ItemContent className="min-w-0 flex-1 flex-col items-start gap-1">
										<ItemTitle className="max-w-full truncate">{extension.title}</ItemTitle>
										<p className="line-clamp-2 max-w-full text-[11px] leading-4 text-muted-foreground">
											{extension.description}
										</p>
									</ItemContent>
									<ItemActions className="ml-auto flex-none items-center justify-end gap-2">
										<Badge variant="secondary" className="text-[10px] leading-none">
											{extension.metadata.category}
										</Badge>
										<ChevronRight className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
									</ItemActions>
								</Item>
								<Delete
									extension={extension}
									disabled={loading || importing}
									onDeleted={(extensionId) => {
										setExtensions((current) =>
											current.filter(({ id }) => id !== extensionId)
										);
									}}
									onError={setErrorMessage}
								/>
							</div>
						))
					)}
				</SettingsPanel>
			</SettingsSection>
		</SettingsPageShell>
	);
};

export default ExtensionsPage;
