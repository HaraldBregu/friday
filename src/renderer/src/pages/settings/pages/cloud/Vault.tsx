import React, { useEffect, useState } from 'react';
import { AlertTriangle, KeyRound, RefreshCw } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import type { ProviderVaultStatus } from '@shared/provider_types';
import {
	SettingsLoadingRows,
	SettingsNotice,
	SettingsRow,
	SettingsValue,
} from '../../components';

const Vault: React.FC = () => {
	const { t } = useTranslation();
	const { state: authState, localOnly } = useAuth();
	const [status, setStatus] = useState<ProviderVaultStatus | null>(null);
	const [loading, setLoading] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [passphrase, setPassphrase] = useState('');
	const [confirmation, setConfirmation] = useState('');
	const [loadVersion, setLoadVersion] = useState(0);
	const enabled = authState.status === 'signedIn' && !localOnly;

	useEffect(() => {
		if (!enabled) {
			setStatus(null);
			setLoading(false);
			setError(null);
			return;
		}

		let cancelled = false;
		setLoading(true);
		void window.provider.vaultStatus().then(
			(next) => {
				if (cancelled) return;
				setStatus(next);
				setError(null);
				setLoading(false);
			},
			() => {
				if (cancelled) return;
				setError(t('settings.storage.credentials.errors.load'));
				setLoading(false);
			}
		);
		return () => {
			cancelled = true;
		};
	}, [enabled, loadVersion, t]);

	if (!enabled) return null;

	const submitPassphrase = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		if (!status || busy || passphrase.length < 12) return;
		if (!status.cloudConfigured && passphrase !== confirmation) {
			setError(t('settings.storage.credentials.errors.mismatch'));
			return;
		}

		setBusy(true);
		setError(null);
		try {
			setStatus(
				status.cloudConfigured
					? await window.provider.unlockVault(passphrase)
					: await window.provider.setupVault(passphrase)
			);
			setPassphrase('');
			setConfirmation('');
		} catch {
			setError(
				t(
					status.cloudConfigured
						? 'settings.storage.credentials.errors.unlock'
						: 'settings.storage.credentials.errors.setup'
				)
			);
		} finally {
			setBusy(false);
		}
	};

	const sync = async (): Promise<void> => {
		if (busy) return;
		setBusy(true);
		setError(null);
		try {
			setStatus(await window.provider.syncVault());
		} catch {
			setError(t('settings.storage.credentials.errors.sync'));
		} finally {
			setBusy(false);
		}
	};

	if (loading && !status) {
		return (
			<div aria-busy="true">
				<SettingsLoadingRows rows={2} />
			</div>
		);
	}

	if (!status) {
		return (
			<div className="flex flex-wrap items-center gap-2">
				{error && (
					<SettingsNotice className="min-w-0 flex-1" variant="destructive" icon={AlertTriangle}>
						{error}
					</SettingsNotice>
				)}
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setLoadVersion((current) => current + 1)}
				>
					{t('common.tryAgain')}
				</Button>
			</div>
		);
	}

	if (!status.unlocked) {
		const settingUp = !status.cloudConfigured;
		const mismatch = settingUp && confirmation.length > 0 && passphrase !== confirmation;
		return (
			<form onSubmit={(event) => void submitPassphrase(event)}>
				<Card size="sm" className="gap-0! py-0!" aria-busy={busy}>
					<CardHeader className="border-b border-border/60 py-3">
						<CardTitle>
							<h2 className="text-sm font-medium">
								{t('settings.storage.credentials.title')}
							</h2>
						</CardTitle>
						<CardDescription className="text-xs">
							{t(
								settingUp
									? 'settings.storage.credentials.setupDescription'
									: 'settings.storage.credentials.unlockDescription'
							)}
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3 py-3! sm:grid-cols-2">
						<div className="grid gap-1.5">
							<Label htmlFor="cloud-key-passphrase">
								{t('settings.storage.credentials.passphrase')}
							</Label>
							<Input
								id="cloud-key-passphrase"
								type="password"
								autoComplete={settingUp ? 'new-password' : 'current-password'}
								minLength={12}
								maxLength={1024}
								value={passphrase}
								disabled={busy}
								onChange={(event) => {
									setPassphrase(event.target.value);
									setError(null);
								}}
							/>
						</div>
						{settingUp && (
							<div className="grid gap-1.5">
								<Label htmlFor="cloud-key-passphrase-confirmation">
									{t('settings.storage.credentials.confirmPassphrase')}
								</Label>
								<Input
									id="cloud-key-passphrase-confirmation"
									type="password"
									autoComplete="new-password"
									minLength={12}
									maxLength={1024}
									value={confirmation}
									disabled={busy}
									aria-invalid={mismatch}
									onChange={(event) => {
										setConfirmation(event.target.value);
										setError(null);
									}}
								/>
							</div>
						)}
						<p className="text-xs text-muted-foreground sm:col-span-2">
							{t('settings.storage.credentials.passphraseHelp')}
						</p>
						{(error || mismatch) && (
							<SettingsNotice
								className="sm:col-span-2"
								variant="destructive"
								icon={AlertTriangle}
							>
								{mismatch ? t('settings.storage.credentials.errors.mismatch') : error}
							</SettingsNotice>
						)}
					</CardContent>
					<CardFooter className="justify-end">
						<Button
							type="submit"
							size="sm"
							disabled={busy || passphrase.length < 12 || (settingUp && mismatch)}
						>
							<KeyRound className="size-3" />
							{t(
								busy
									? settingUp
										? 'settings.storage.credentials.settingUp'
										: 'settings.storage.credentials.unlocking'
									: settingUp
										? 'settings.storage.credentials.setup'
										: 'settings.storage.credentials.unlock'
							)}
						</Button>
					</CardFooter>
				</Card>
			</form>
		);
	}

	return (
		<>
			<Card size="sm" className="gap-0! py-0!" aria-busy={busy}>
				<CardHeader className="border-b border-border/60 py-3">
					<CardTitle>
						<h2 className="text-sm font-medium">{t('settings.storage.credentials.title')}</h2>
					</CardTitle>
					<CardDescription className="text-xs">
						{t('settings.storage.credentials.readyDescription')}
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0!">
					<SettingsRow
						title={t('settings.storage.credentials.status')}
						actions={
							<SettingsValue>{t('settings.storage.credentials.ready')}</SettingsValue>
						}
					/>
					<SettingsRow
						title={t('settings.storage.credentials.pending')}
						actions={<SettingsValue>{status.pending}</SettingsValue>}
					/>
					<SettingsRow
						title={t('settings.storage.credentials.lastSync')}
						actions={
							<SettingsValue>
								{status.lastSyncedAt
									? new Date(status.lastSyncedAt).toLocaleString()
									: t('settings.storage.credentials.never')}
							</SettingsValue>
						}
					/>
				</CardContent>
				<CardFooter className="justify-end">
					<Button type="button" size="sm" disabled={busy} onClick={() => void sync()}>
						<RefreshCw className={busy ? 'size-3 animate-spin' : 'size-3'} />
						{t(
							busy ? 'settings.storage.credentials.syncing' : 'settings.storage.credentials.sync'
						)}
					</Button>
				</CardFooter>
			</Card>
			{status.persistence === 'memory' && (
				<SettingsNotice icon={AlertTriangle}>
					{t('settings.storage.credentials.memoryWarning')}
				</SettingsNotice>
			)}
			{error && (
				<SettingsNotice variant="destructive" icon={AlertTriangle}>
					{error}
				</SettingsNotice>
			)}
		</>
	);
};

export default Vault;
