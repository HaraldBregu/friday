import type { AuthService } from '../cloud/auth';

export async function putObject(
	auth: AuthService,
	key: string,
	data: Uint8Array,
	contentType?: string
): Promise<void> {
	const state = auth.getState();
	if ((state.status !== 'signedIn' && state.status !== 'recovery') || !state.user) {
		throw new Error('Sign in to use sync.');
	}
	const { error } = await auth
		.getClient()
		.storage.from('user-files')
		.upload(`${state.user.id}/backups/${key}`, data, {
			upsert: true,
			...(contentType ? { contentType } : {}),
		});
	if (error) throw error;
}
