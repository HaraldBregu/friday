export interface CloudConfig {
	url: string;
	publishableKey: string;
	redirectUrl: string;
}

export function loadCloudConfig(): CloudConfig | null {
	const url =
		import.meta.env.MAIN_VITE_SUPABASE_URL?.trim() ?? process.env.SUPABASE_URL?.trim();
	const publishableKey =
		import.meta.env.MAIN_VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ??
		process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
	if (!url || !publishableKey || publishableKey.startsWith('sb_secret_')) return null;
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== 'https:' && parsed.hostname !== '127.0.0.1') return null;
		return {
			url: parsed.origin,
			publishableKey,
			redirectUrl: 'kucedr://auth/callback',
		};
	} catch {
		return null;
	}
}
