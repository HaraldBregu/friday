import { useEffect } from 'react';
import { app, isKucedr } from '@kucedr/sdk';

export function useTheme(): void {
	useEffect(() => {
		if (!isKucedr()) return;
		let active = true;
		const apply = (theme: { isDark: boolean; colors: Record<string, string> }): void => {
			if (!active) return;
			document.documentElement.classList.toggle('dark', theme.isDark);
			for (const [name, value] of Object.entries(theme.colors)) {
				document.documentElement.style.setProperty(`--${name}`, value);
			}
		};
		void app.getThemeData().then(apply).catch(() => undefined);
		const unsubscribe = app.onThemeModeChanged(apply);
		return () => {
			active = false;
			unsubscribe();
		};
	}, []);
}
