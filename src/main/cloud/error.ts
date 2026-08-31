export function publicAuthError(error: unknown): Error {
	const record = typeof error === 'object' && error !== null ? error : {};
	const code = 'code' in record && typeof record.code === 'string' ? record.code : '';
	const messages: Record<string, string> = {
		invalid_credentials: 'The email or password is incorrect.',
		email_not_confirmed: 'Confirm your email address before signing in.',
		user_already_exists: 'An account already exists for this email address.',
		weak_password: 'Use a stronger password with at least eight characters.',
		over_email_send_rate_limit: 'Too many emails were requested. Try again later.',
		over_request_rate_limit: 'Too many attempts. Try again later.',
		same_password: 'Choose a password you have not used for this account.',
	};
	const mapped = messages[code] ?? 'Authentication failed. Please try again.';
	const result = new Error(mapped);
	result.name = code || 'AuthError';
	return result;
}
