import React, { useState } from 'react';
import { AlertCircle, LogOut, UserRound } from 'lucide-react';
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
	const { state } = useAuth();
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
						<SettingsValue>{state.user?.email ?? 'Unavailable'}</SettingsValue>
					</SettingsRow>
					<SettingsRow title="Session storage">
						<SettingsValue>
							{state.persistence === 'encrypted' ? 'System encrypted' : 'Memory only'}
						</SettingsValue>
					</SettingsRow>
				</SettingsPanel>
			</SettingsSection>
			<SettingsNotice icon={AlertCircle}>
				Signing out removes the cloud session from this device. Existing local Friday files remain on the device.
			</SettingsNotice>
			{error ? <SettingsNotice icon={AlertCircle} variant="destructive">{error}</SettingsNotice> : null}
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
		</SettingsPageShell>
	);
};

export default AccountPage;
