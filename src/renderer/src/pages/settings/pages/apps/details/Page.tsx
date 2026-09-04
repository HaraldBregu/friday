import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Blocks, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemTitle } from '@/components/ui/item';
import type { Extension } from '../../../../../../../shared/extension_types';
import {
	SettingsEmptyState,
	SettingsLoadingRows,
	SettingsNotice,
	SettingsPageHeader,
	SettingsPageShell,
	SettingsPanel,
	SettingsSection,
} from '../../../components';

const KNOWN_METADATA_KEYS = ['version', 'category', 'entry'];

const ExtensionDetailsPage: React.FC = () => {
	const { t } = useTranslation();
	const { extensionId } = useParams<{ extensionId: string }>();
	const decodedExtensionId = decodeURIComponent(extensionId ?? '');
	const [extension, setExtension] = useState<Extension | null>(null);
	const [loading, setLoading] = useState(true);
	const [opening, setOpening] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const loadErrorFallback = t('settings.extensions.loadError');

	const loadExtension = useCallback(async (): Promise<void> => {
		setLoading(true);
		setErrorMessage('');
		try {
			const list = await window.extensions.list();
			setExtension(list.find((item) => item.id === decodedExtensionId) ?? null);
		} catch {
			setErrorMessage(loadErrorFallback);
			setExtension(null);
		} finally {
			setLoading(false);
		}
	}, [decodedExtensionId, loadErrorFallback]);

	useEffect(() => {
		void loadExtension();
	}, [loadExtension]);

	const handleOpen = useCallback(async (): Promise<void> => {
		if (!extension) return;
		setOpening(true);
		setErrorMessage('');
		try {
			await window.extensions.open(extension.id);
		} catch {
			setErrorMessage(t('settings.extensions.openError'));
		} finally {
			setOpening(false);
		}
	}, [extension, t]);

	if (loading) {
		return (
			<SettingsPageShell>
				<SettingsPageHeader title={t('settings.extensions.details')} />
				<SettingsPanel>
					<SettingsLoadingRows rows={3} />
				</SettingsPanel>
			</SettingsPageShell>
		);
	}

	if (!extension) {
		return (
			<SettingsPageShell>
				<SettingsPageHeader title={t('settings.extensions.details')} />
				{errorMessage && (
					<SettingsNotice variant="destructive" icon={AlertTriangle}>
						{errorMessage}
					</SettingsNotice>
				)}
				<SettingsPanel>
					<SettingsEmptyState
						icon={Blocks}
						title={decodedExtensionId || t('settings.extensions.empty')}
						description={t('settings.extensions.emptyDescription')}
						className="min-h-28"
					/>
				</SettingsPanel>
			</SettingsPageShell>
		);
	}

	const extraMetadata = Object.entries(extension.metadata).filter(
		([key]) => !KNOWN_METADATA_KEYS.includes(key)
	);

	return (
		<SettingsPageShell>
			<SettingsPageHeader
				title={extension.title}
				description={extension.description}
				action={
					<Button variant="outline" size="xs" onClick={() => void handleOpen()} disabled={opening}>
						<ExternalLink className="size-3" />
						{t('settings.extensions.open')}
					</Button>
				}
			/>

			{errorMessage && (
				<SettingsNotice variant="destructive" icon={AlertTriangle}>
					{errorMessage}
				</SettingsNotice>
			)}

			<SettingsSection title={t('settings.extensions.details')}>
				<SettingsPanel>
					<ExtensionDetail label={t('settings.extensions.detailId')} value={extension.id} mono />
					<ExtensionDetail
						label={t('settings.extensions.detailVersion')}
						value={extension.metadata.version}
					/>
					<ExtensionDetail
						label={t('settings.extensions.detailCategory')}
						value={extension.metadata.category}
					/>
					<ExtensionDetail
						label={t('settings.extensions.detailEntry')}
						value={extension.metadata.entry}
						mono
					/>
					{extraMetadata.map(([key, value]) => (
						<ExtensionDetail
							key={key}
							label={key}
							value={typeof value === 'string' ? value : JSON.stringify(value)}
						/>
					))}
				</SettingsPanel>
			</SettingsSection>
		</SettingsPageShell>
	);
};

function ExtensionDetail({
	label,
	value,
	mono,
}: {
	readonly label: string;
	readonly value: string;
	readonly mono?: boolean;
}): React.JSX.Element {
	return (
		<Item variant="outline" size="md" className="border-b border-border/60 last:border-b-0">
			<ItemContent className="min-w-0">
				<ItemTitle>{label}</ItemTitle>
			</ItemContent>
			<ItemActions className="ml-auto min-w-0 flex-none justify-end">
				<span
					className={
						mono
							? 'max-w-md break-all text-right font-mono text-[11px] text-foreground'
							: 'max-w-md break-words text-right text-xs text-foreground'
					}
				>
					{value}
				</span>
			</ItemActions>
		</Item>
	);
}

export default ExtensionDetailsPage;
