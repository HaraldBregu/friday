import React, { useState } from 'react';
import { AlertCircle, LogIn, LogOut, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
	SettingsNotice,
	SettingsPageHeader,
	SettingsPageShell,
	SettingsPanel,
	SettingsRow,
	SettingsSection,
	SettingsValue,
} from '../../components';

const AccountPage: React.FC = () => {
	const { state, localOnly, requireSignIn } = useAuth();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');

	return (
		<SettingsPageShell>
			<SettingsPageHeader
				title="Account"
				description="Your Friday Cloud identity and session."
				icon={UserRound}
			/>
			<SettingsSection title="Identity">
				<SettingsPanel>
					<SettingsRow title="Email">
						<SettingsValue>{localOnly ? 'Not signed in' : state.user?.email ?? 'Unavailable'}</SettingsValue>
					</SettingsRow>
					<SettingsRow title="Session storage">
						<SettingsValue>
							{localOnly
								? 'Local only'
								: state.persistence === 'encrypted'
									? 'System encrypted'
									: 'Memory only'}
						</SettingsValue>
					</SettingsRow>
				</SettingsPanel>
			</SettingsSection>
			<SettingsNotice icon={AlertCircle}>
				{localOnly
					? 'Your chats and settings remain on this device until you sign in to Friday Cloud.'
					: 'Signing out removes the cloud session, but local files remain linked to this account to prevent cross-account data exposure.'}
			</SettingsNotice>
			{error ? <SettingsNotice icon={AlertCircle} variant="destructive">{error}</SettingsNotice> : null}
			{localOnly ? (
				<Button type="button" className="self-start" onClick={requireSignIn}>
					<LogIn aria-hidden="true" />
					Sign in to Friday Cloud
				</Button>
			) : (
				<Button
					type="button"
					variant="destructive"
					className="self-start"
					disabled={busy}
					onClick={() => {
						setBusy(true);
						setError('');
						void window.auth
							.signOut()
							.catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not sign out.'))
							.finally(() => setBusy(false));
					}}
				>
					<LogOut aria-hidden="true" />
					{busy ? 'Signing out…' : 'Sign out'}
				</Button>
			)}
		</SettingsPageShell>
	);
};

export default AccountPage;
