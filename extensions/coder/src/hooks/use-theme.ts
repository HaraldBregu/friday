import { useEffect } from 'react';
import { app, isFriday } from '@friday/sdk';

export function useTheme() {
	useEffect(() => {
		if (!isFriday()) return;
		let active = true;
		const apply = (theme: { isDark: boolean; colors: Record<string, string> }) => {
			if (!active) return;
			document.documentElement.classList.toggle('dark', theme.isDark);
			for (const [name, value] of Object.entries(theme.colors)) {
				document.documentElement.style.setProperty(`--${name}`, value);
			}
		};
		void app
			.getThemeData()
			.then(apply)
			.catch(() => undefined);
		const unsubscribe = app.onThemeModeChanged(apply);
		return () => {
			active = false;
			unsubscribe();
		};
	}, []);
}
