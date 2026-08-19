import React, { useState } from 'react';
import {
	AlertTriangle,
	CheckCircle2,
	ChevronDown,
	ExternalLink,
	HardDrive,
	Loader2,
	Pencil,
	Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProviderAvatar } from '@/components/provider-avatar';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { openExternalUrl } from '@/lib/external-links';
import type { PublicProvider } from '@shared/provider_types';
import type { StorageConfig } from '../../../../../../shared/storage_types';
import { getErrorMessage, MASKED_API_KEY_LABEL } from '../../../start/constants';
import { SettingsField, SettingsNotice, SettingsRow } from '../../components';

type StringConfigKey =
	| 'name'
	| 'endpoint'
	| 'region'
	| 'bucket'
	| 'accessKeyId'
	| 'secretAccessKey';

interface FieldDef {
	key: StringConfigKey;
	labelKey: string;
	type?: 'password';
	placeholder?: string;
}

const CONNECTION_FIELDS: readonly FieldDef[] = [
	{
		key: 'name',
		labelKey: 'settings.storage.name',
		placeholder: 'e.g. Cloudflare R2, AWS backup',
	},
	{
		key: 'endpoint',
		labelKey: 'settings.storage.endpoint',
		placeholder: 'https://s3.amazonaws.com',
	},
	{ key: 'region', labelKey: 'settings.storage.region', placeholder: 'us-east-1' },
	{ key: 'bucket', labelKey: 'settings.storage.bucket' },
];

const CREDENTIAL_FIELDS: readonly FieldDef[] = [
	{ key: 'accessKeyId', labelKey: 'settings.storage.accessKeyId' },
	{ key: 'secretAccessKey', labelKey: 'settings.storage.secretAccessKey', type: 'password' },
];

const isConfigured = (config: StorageConfig): boolean =>
	Boolean(config.bucket && config.accessKeyId && config.secretAccessKey);

const mask = (value: string): string =>
	value.length > 4 ? `••••${value.slice(-4)}` : '•'.repeat(value.length);

function GroupHeading({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
	return (
		<h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
			{children}
		</h3>
	);
}

interface ProviderCardProps {
	readonly storage: StorageConfig;
	readonly provider?: PublicProvider;
	readonly onSaved: (saved: StorageConfig) => void;
	readonly onRemoved: () => void;
	readonly hideDelete?: boolean;
	readonly hideDropdown?: boolean;
	readonly subtitle?: string;
	readonly linkUrl?: string;
}

export function ProviderCard({
	storage,
	provider,
	onSaved,
	onRemoved,
	hideDelete = false,
	hideDropdown = false,
	subtitle,
	linkUrl,
}: ProviderCardProps): React.JSX.Element {
	const { t } = useTranslation();
	const [instanceId] = useState(() => storage.id || crypto.randomUUID());
	const [canonical, setCanonical] = useState(storage);
	const [draft, setDraft] = useState(storage);
	const [editing, setEditing] = useState(!storage.id);
	const [expanded, setExpanded] = useState(!storage.id);
	const [saving, setSaving] = useState(false);
	const [testing, setTesting] = useState(false);
	const [removing, setRemoving] = useState(false);
	const [removeOpen, setRemoveOpen] = useState(false);
	const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
	const [error, setError] = useState<string | null>(null);

	const update = (key: StringConfigKey, value: string | number): void => {
		setDraft((current) => ({ ...current, [key]: value }));
		setStatus(null);
	};

	const startEditing = (): void => {
		setDraft(canonical);
		setEditing(true);
		setExpanded(true);
		setStatus(null);
		setError(null);
	};

	const cancelEditing = (): void => {
		if (!canonical.id) {
			onRemoved();
			return;
		}
		setDraft(canonical);
		setEditing(false);
		setExpanded(false);
		setStatus(null);
		setError(null);
	};

	const save = async (target: StorageConfig = draft): Promise<void> => {
		setSaving(true);
		setError(null);
		try {
			const saved = await window.storage.saveStorageConfig(target);
			setCanonical(saved);
			setDraft(saved);
			setEditing(false);
			setStatus({ ok: true, message: t('settings.storage.saved') });
			onSaved(saved);
		} catch (err) {
			setError(getErrorMessage(err, t('settings.storage.errors.save')));
		} finally {
			setSaving(false);
		}
	};

	const test = async (): Promise<void> => {
		setTesting(true);
		setError(null);
		setStatus(null);
		try {
			const result = await window.storage.testConnection(draft);
			setStatus({
				ok: result.ok,
				message: result.ok
					? t('settings.storage.testOk')
					: (result.error ?? t('settings.storage.errors.test')),
			});
		} catch (err) {
			setError(getErrorMessage(err, t('settings.storage.errors.test')));
		} finally {
			setTesting(false);
		}
	};

	const remove = async (): Promise<void> => {
		setRemoving(true);
		setRemoveOpen(false);
		setError(null);
		try {
			await window.storage.deleteStorageConfig(canonical.id);
			onRemoved();
		} catch (err) {
			setError(getErrorMessage(err, t('settings.storage.errors.delete')));
			setRemoving(false);
		}
	};

	const requestRemove = (): void => {
		if (!canonical.id) {
			onRemoved();
			return;
		}
		setRemoveOpen(true);
	};

	const renderField = (field: FieldDef, value: string): React.JSX.Element => (
		<SettingsField
			key={field.key}
			id={`storage-${instanceId}-${field.key}`}
			label={t(field.labelKey)}
		>
			<Input
				id={`storage-${instanceId}-${field.key}`}
				type={field.type ?? 'text'}
				value={value}
				placeholder={field.placeholder}
				autoComplete="off"
				onChange={(event) => update(field.key, event.target.value)}
			/>
		</SettingsField>
	);

	const viewRows: readonly { labelKey: string; value: string }[] = [
		{
			labelKey: 'settings.storage.endpoint',
			value: canonical.endpoint || t('settings.storage.endpointDefault'),
		},
		{ labelKey: 'settings.storage.region', value: canonical.region },
		{ labelKey: 'settings.storage.bucket', value: canonical.bucket },
		{ labelKey: 'settings.storage.accessKeyId', value: mask(canonical.accessKeyId) },
		{ labelKey: 'settings.storage.secretAccessKey', value: mask(canonical.secretAccessKey) },
	];

	return (
		<Card size="sm" aria-busy={saving || testing || removing}>
			<Collapsible open={expanded} onOpenChange={setExpanded} className="flex flex-col gap-3">
				<CardHeader className={cn('select-none items-center', expanded && 'border-b')}>
					<div className="flex items-center gap-2.5 min-w-0 flex-1">
						{provider ? (
							<ProviderAvatar
								providerId={provider.id}
								name={provider.name}
								iconDarkUrl={provider.iconDarkUrl}
								iconLightUrl={provider.iconLightUrl}
							/>
						) : (
							<div className="flex size-8 flex-shrink-0 items-center justify-center rounded-md bg-muted">
								<HardDrive className="size-4 text-muted-foreground" />
							</div>
						)}
						<div className="min-w-0 flex-1">
							<div className="flex min-w-0 items-center gap-1.5">
								<CardTitle className="min-w-0 truncate">
									{canonical.name || t('settings.storage.newProviderTitle')}
								</CardTitle>
								{linkUrl && (
									<Button
										type="button"
										variant="ghost"
										size="icon-xs"
										className="size-5 text-muted-foreground hover:text-foreground"
										aria-label={t('settings.storage.openProviderSetup', {
											name: canonical.name,
										})}
										onClick={(event) => {
											event.stopPropagation();
											openExternalUrl(linkUrl);
										}}
									>
										<ExternalLink className="size-3" />
									</Button>
								)}
							</div>
							{(subtitle || isConfigured(canonical)) && (
								<p className="truncate text-xs font-medium leading-tight text-muted-foreground">
									{isConfigured(canonical) ? MASKED_API_KEY_LABEL : subtitle}
								</p>
							)}
						</div>
					</div>
					<CardAction
						className="row-span-1 flex items-center gap-2 self-center"
						onClick={(event) => event.stopPropagation()}
					>
						{!hideDropdown && (
							<CollapsibleTrigger
								render={
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label={
											expanded ? t('settings.storage.collapse') : t('settings.storage.expand')
										}
									>
										<ChevronDown
											className={cn('size-3 transition-transform', expanded && 'rotate-180')}
										/>
									</Button>
								}
							/>
						)}
						{!editing && (
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={t('settings.storage.edit')}
								onClick={() => {
									setExpanded(true);
									startEditing();
								}}
							>
								<Pencil className="size-3" />
							</Button>
						)}
						{!hideDelete && (
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={t('settings.storage.removeProvider')}
								onClick={requestRemove}
								disabled={removing || saving}
							>
								<Trash2 className="size-3" />
							</Button>
						)}
					</CardAction>
				</CardHeader>

				<CollapsibleContent className="flex flex-col gap-3">
					<CardContent className="space-y-4">
						{error && (
							<div role="alert">
								<SettingsNotice variant="destructive" icon={AlertTriangle}>
									{error}
								</SettingsNotice>
							</div>
						)}
						{status && (
							<div role="status" aria-live="polite">
								<SettingsNotice
									variant={status.ok ? 'default' : 'destructive'}
									icon={status.ok ? CheckCircle2 : AlertTriangle}
								>
									{status.message}
								</SettingsNotice>
							</div>
						)}

						{editing ? (
							<div className="space-y-5">
								<section className="space-y-3">
									<GroupHeading>{t('settings.storage.connectionTitle')}</GroupHeading>
									{renderField(CONNECTION_FIELDS[0], draft.name)}
									{renderField(CONNECTION_FIELDS[1], draft.endpoint)}
									<div className="grid gap-3 sm:grid-cols-2">
										{renderField(CONNECTION_FIELDS[2], draft.region)}
										{renderField(CONNECTION_FIELDS[3], draft.bucket)}
									</div>
								</section>

								<section className="space-y-3">
									<GroupHeading>{t('settings.storage.credentialsTitle')}</GroupHeading>
									{CREDENTIAL_FIELDS.map((field) => renderField(field, draft[field.key]))}
								</section>

								<section className="space-y-3">
									<GroupHeading>{t('settings.storage.optionsTitle')}</GroupHeading>
									<SettingsRow
										title={t('settings.storage.forcePathStyle')}
										description={t('settings.storage.forcePathStyleDescription')}
										className="px-0"
										actions={
											<Switch
												checked={draft.forcePathStyle}
												aria-label={t('settings.storage.forcePathStyle')}
												onCheckedChange={(checked) => {
													setDraft((current) => ({ ...current, forcePathStyle: checked }));
													setStatus(null);
												}}
											/>
										}
									/>
								</section>
							</div>
						) : (
							<div className="space-y-5">
								<dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
									{viewRows.map((row) => (
										<div key={row.labelKey} className="flex min-w-0 flex-col gap-1">
											<dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
												{t(row.labelKey)}
											</dt>
											<dd className="truncate font-mono text-xs text-foreground">{row.value}</dd>
										</div>
									))}
								</dl>
							</div>
						)}
					</CardContent>

					{(editing || isConfigured(canonical)) && (
							<CardFooter className="flex-wrap justify-end gap-2">
								{editing && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => void test()}
										disabled={testing || saving}
									>
										{testing && <Loader2 className="size-3 animate-spin" />}
										{testing ? t('settings.storage.testing') : t('settings.storage.test')}
									</Button>
								)}
							{canonical.id && (
								<Button variant="ghost" size="sm" onClick={cancelEditing} disabled={saving}>
									{t('settings.storage.cancel')}
								</Button>
							)}
								<Button
									size="sm"
									onClick={() => void save()}
									disabled={saving || testing}
								>
								{saving ? t('settings.storage.saving') : t('settings.storage.save')}
							</Button>
						</CardFooter>
					)}
				</CollapsibleContent>
			</Collapsible>

			<Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('settings.storage.removeDialog.title')}</DialogTitle>
						<DialogDescription>
							{t('settings.storage.removeDialog.description')}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setRemoveOpen(false)}>
							{t('settings.storage.cancel')}
						</Button>
						<Button variant="destructive" onClick={() => void remove()} disabled={removing}>
							{t('settings.storage.removeDialog.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
