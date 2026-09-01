import type { AuthApi } from '../shared/auth_types';
import { AuthChannels } from '../shared/ipc_channels_definitions';
import { typedInvokeUnwrap, typedOn } from '../shared/ipc_types';

export const auth: AuthApi = {
	getState: () => typedInvokeUnwrap(AuthChannels.getState),
	signIn: (credentials) => typedInvokeUnwrap(AuthChannels.signIn, credentials),
	signInWithGoogle: () => typedInvokeUnwrap(AuthChannels.signInWithGoogle),
	signUp: (input) => typedInvokeUnwrap(AuthChannels.signUp, input),
	resendConfirmation: (email) => typedInvokeUnwrap(AuthChannels.resendConfirmation, email),
	requestPasswordReset: (email) => typedInvokeUnwrap(AuthChannels.requestPasswordReset, email),
	updatePassword: (password) => typedInvokeUnwrap(AuthChannels.updatePassword, password),
	signOut: () => typedInvokeUnwrap(AuthChannels.signOut),
	onStateChanged: (callback) => typedOn(AuthChannels.stateChanged, callback),
};
