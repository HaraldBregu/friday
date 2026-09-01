import type { AuthService } from '../cloud/auth';

export async function getObject(auth: AuthService, key: string): Promise<Uint8Array> {
	const state = auth.getState();
	if ((state.status !== 'signedIn' && state.status !== 'recovery') || !state.user) {
		throw new Error('Sign in to use sync.');
	}
	const { data, error } = await auth
		.getClient()
		.storage.from('user-files')
		.download(`${state.user.id}/backups/${key}`);
	if (error) throw error;
	return new Uint8Array(await data.arrayBuffer());
}
