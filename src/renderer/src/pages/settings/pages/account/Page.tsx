import React, { useEffect, useState } from 'react';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import type { AccountProfile } from '../../../../../../shared/auth_types';
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
	const [profile, setProfile] = useState<AccountProfile>({ firstName: '', lastName: '' });
	const [storedProfile, setStoredProfile] = useState<AccountProfile>({
		firstName: '',
		lastName: '',
	});
	const [profileLoaded, setProfileLoaded] = useState(false);
	const [profileLoading, setProfileLoading] = useState(false);
	const [profileSaving, setProfileSaving] = useState(false);
	const [profileSaved, setProfileSaved] = useState(false);
	const [sessionBusy, setSessionBusy] = useState(false);
	const [error, setError] = useState('');
	const signedIn = state.status === 'signedIn' && !localOnly;

	useEffect(() => {
		if (!signedIn) {
			setProfileLoaded(false);
			setProfile({ firstName: '', lastName: '' });
			setStoredProfile({ firstName: '', lastName: '' });
			return;
		}
		let mounted = true;
		setProfileLoading(true);
		setProfileSaved(false);
		setError('');
		void window.auth
			.getProfile()
			.then((nextProfile) => {
				if (!mounted) return;
				setProfile(nextProfile);
				setStoredProfile(nextProfile);
				setProfileLoaded(true);
			})
			.catch((cause) => {
				if (!mounted) return;
				setProfileLoaded(false);
				setError(cause instanceof Error ? cause.message : 'Could not load account details.');
			})
			.finally(() => {
				if (mounted) setProfileLoading(false);
			});
		return () => {
			mounted = false;
		};
	}, [signedIn, state.user?.id]);

	const firstName = profile.firstName.trim();
	const lastName = profile.lastName.trim();
	const profileDirty =
		profile.firstName !== storedProfile.firstName || profile.lastName !== storedProfile.lastName;

	const saveProfile = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		setProfileSaving(true);
		setProfileSaved(false);
		setError('');
		try {
			const saved = await window.auth.updateProfile({ firstName, lastName });
			setProfile(saved);
			setStoredProfile(saved);
			setProfileSaved(true);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Could not save account details.');
		} finally {
			setProfileSaving(false);
		}
	};

	return (
		<SettingsPageShell>
			<SettingsPageHeader
				title="Account"
				description="Manage your personal details and sign-in status."
				action={
					profileSaving || profileSaved ? (
						<SettingsValue>
							<span role="status">{profileSaving ? 'Saving…' : 'Saved'}</span>
						</SettingsValue>
					) : undefined
				}
			/>
			{error ? (
				<div role="alert">
					<SettingsNotice icon={AlertCircle} variant="destructive">
						{error}
					</SettingsNotice>
				</div>
			) : null}
			<SettingsSection title="Identity">
				<SettingsPanel>
					<SettingsRow title="Status">
						<SettingsValue>{signedIn ? 'Signed in' : 'Not signed in'}</SettingsValue>
					</SettingsRow>
					{signedIn ? (
						<SettingsRow title="Email">
							<SettingsValue>{state.user?.email ?? 'Unavailable'}</SettingsValue>
						</SettingsRow>
					) : null}
				</SettingsPanel>
			</SettingsSection>
			{signedIn ? (
				<SettingsSection
					title="Personal details"
					description="These names are stored with your Friday account."
				>
					<SettingsPanel>
						<form className="grid gap-3 p-3" onSubmit={saveProfile}>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="grid gap-1.5">
									<Label htmlFor="account-first-name" className="text-xs">
										First name
									</Label>
									<Input
										id="account-first-name"
										autoComplete="given-name"
										maxLength={80}
										required
										value={profile.firstName}
										disabled={profileLoading || profileSaving || !profileLoaded}
										className="h-8 text-xs"
										onChange={(event) => {
											setProfile((current) => ({ ...current, firstName: event.target.value }));
											setProfileSaved(false);
										}}
									/>
								</div>
								<div className="grid gap-1.5">
									<Label htmlFor="account-last-name" className="text-xs">
										Last name
									</Label>
									<Input
										id="account-last-name"
										autoComplete="family-name"
										maxLength={80}
										required
										value={profile.lastName}
										disabled={profileLoading || profileSaving || !profileLoaded}
										className="h-8 text-xs"
										onChange={(event) => {
											setProfile((current) => ({ ...current, lastName: event.target.value }));
											setProfileSaved(false);
										}}
									/>
								</div>
							</div>
							<div className="flex justify-end">
								<Button
									type="submit"
									size="xs"
									disabled={
										profileLoading ||
										profileSaving ||
										!profileLoaded ||
										!profileDirty ||
										!firstName ||
										!lastName
									}
								>
									{profileSaving ? (
										<LoaderCircle className="animate-spin" aria-hidden="true" />
									) : null}
									Save changes
								</Button>
							</div>
						</form>
					</SettingsPanel>
				</SettingsSection>
			) : null}
			<SettingsSection title="Session">
				<SettingsPanel>
					<SettingsRow
						title={localOnly ? 'Sign in' : 'Sign out'}
						description={
							localOnly
								? 'Sign in to sync your data across devices.'
								: 'You can continue using Friday on this device after signing out.'
						}
					>
						{localOnly ? (
							<Button type="button" size="xs" onClick={requireSignIn}>
								Sign in
							</Button>
						) : (
							<Button
								type="button"
								size="xs"
								variant="outline"
								disabled={sessionBusy}
								onClick={() => {
									setSessionBusy(true);
									setError('');
									void window.auth
										.signOut()
										.catch((cause) =>
											setError(
												cause instanceof Error ? cause.message : 'Could not sign out.'
											)
										)
										.finally(() => setSessionBusy(false));
								}}
							>
								{sessionBusy ? (
									<LoaderCircle className="animate-spin" aria-hidden="true" />
								) : null}
								Sign out
							</Button>
						)}
					</SettingsRow>
				</SettingsPanel>
			</SettingsSection>
		</SettingsPageShell>
	);
};

export default AccountPage;
