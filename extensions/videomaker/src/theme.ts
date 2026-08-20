import { useEffect, useState } from 'react';
import { app, isFriday, type AppThemeData } from '@friday/sdk';

const fallbackTheme: AppThemeData = {
	themeMode: 'light',
	isDark: false,
	colors: {},
};

const themeVariables = [
	['background', 'background'],
	['surface', 'card'],
	['surface-alt', 'muted'],
	['text', 'foreground'],
	['muted', 'muted-foreground'],
	['border', 'border'],
	['accent', 'primary'],
	['accent-contrast', 'primary-foreground'],
	['danger', 'destructive'],
	['focus', 'ring'],
] as const;

export function useFridayTheme(): AppThemeData {
	const [theme, setTheme] = useState(fallbackTheme);
	useEffect(() => {
		if (!isFriday()) return;
		let active = true;
		app
			.getThemeData()
			.then((value) => active && setTheme(value))
			.catch(() => undefined);
		const unsubscribe = app.onThemeModeChanged((value) => active && setTheme(value));
		return () => {
			active = false;
			unsubscribe();
		};
	}, []);
	useEffect(() => {
		document.documentElement.classList.toggle('dark', theme.isDark);
		for (const [target, source] of themeVariables) {
			const value = theme.colors[source];
			if (value) document.documentElement.style.setProperty(`--${target}`, value);
		}
	}, [theme]);
	return theme;
}
