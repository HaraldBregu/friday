export function publicCloudError(error: unknown): Error {
	const record = typeof error === 'object' && error !== null ? error : {};
	const code = 'code' in record && typeof record.code === 'string' ? record.code : '';
	const messages: Record<string, string> = {
		'23503': 'The selected cloud conversation no longer exists.',
		'23505': 'This cloud item already exists.',
		'42501': 'Your account is not allowed to access this cloud item.',
		PGRST205: 'The required cloud database table is unavailable. Apply the latest Supabase migrations.',
		PGRST116: 'The requested cloud item was not found.',
	};
	const result = new Error(messages[code] ?? 'The cloud request failed. Please try again.');
	result.name = code || 'CloudError';
	return result;
}
