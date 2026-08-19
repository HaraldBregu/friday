import { useEffect, useState, type CSSProperties } from 'react';
import { cva } from 'class-variance-authority';

import {
	app,
	isFriday,
	type AppLanguage,
	type AppTheme,
	type AppThemeColors,
	type AppThemeData,
} from '@friday/sdk';
import { cn } from './lib/utils';
import { Button } from './components/ui/button';
import translations from './i18n.json';

const fallbackColors: AppThemeColors = {
	'radius': '0.625rem',
	'app-window-radius': '16px',
	'app-bg-opacity': '1',
	'app-surface-opacity': '1',
	'app-popover-opacity': '1',
	'app-sidebar-opacity': '1',
	'app-window-background-base': '#fbfbfa',
	'app-surface-background-base': '#ffffff',
	'app-popover-background-base': '#ffffff',
	'app-sidebar-background-base': '#fafaf8',
	'app-window-border': '#19635f',
	'app-window-background':
		'color-mix(in oklch, var(--app-window-background-base) calc(var(--app-bg-opacity) * 100%), transparent)',
	'app-surface-background':
		'color-mix(in oklch, var(--app-surface-background-base) calc(var(--app-surface-opacity) * 100%), transparent)',
	'app-popover-background':
		'color-mix(in oklch, var(--app-popover-background-base) calc(var(--app-popover-opacity) * 100%), transparent)',
	'app-sidebar-background':
		'color-mix(in oklch, var(--app-sidebar-background-base) calc(var(--app-sidebar-opacity) * 100%), transparent)',
	'background': 'var(--app-window-background)',
	'foreground': '#0e0e0e',
	'card': 'var(--app-surface-background)',
	'card-foreground': '#0e0e0e',
	'primary': '#0e0e0e',
	'primary-foreground': '#fbfbfa',
	'secondary': '#eeede9',
	'secondary-foreground': '#0e0e0e',
	'muted': '#eeede9',
	'muted-foreground': '#a3a7a7',
	'accent': '#eae9e5',
	'accent-foreground': '#0e0e0e',
	'border': 'color-mix(in oklch, #a3a7a7 45%, transparent)',
	'input': 'color-mix(in oklch, #a3a7a7 45%, transparent)',
	'ring': '#2b5fb1',
};
const fallbackTheme: AppThemeData = { themeMode: 'light', isDark: false, colors: fallbackColors };
const fallbackLanguage: AppLanguage = 'en';
type DemoStorageValue = { label: string; count: number };
const demoStorageKey = 'demo';
const demoStorageFile = 'demo/message.txt';
const themeBadgeClass = cva('inline-flex h-9 items-center rounded-full border px-4 text-sm font-semibold', {
	variants: {
		variant: {
			light: 'border-border bg-secondary text-secondary-foreground',
			dark: 'border-border bg-secondary text-secondary-foreground',
		},
	},
	defaultVariants: {
		variant: 'light',
	},
});

export default function App() {
	const [theme, setTheme] = useState<AppThemeData>(fallbackTheme);
	const [language, setLanguage] = useState<AppLanguage>(fallbackLanguage);
	const [status, setStatus] = useState(translations.en.waiting);
	const [extensionStoreValue, setExtensionStoreValue] = useState('');
	const [extensionFileValue, setExtensionFileValue] = useState('');
	const [storageBusy, setStorageBusy] = useState(false);
	const inFridayApp = isFriday();
	const text = translations[language] ?? translations.en;
	const themeStyle = Object.fromEntries(
		Object.entries(theme.colors).map(([name, value]) => [`--${name}`, value]),
	) as CSSProperties;

	const ensureFridayApp = () => {
		if (!isFriday()) {
			setStatus(text.runtimeMissing);
			return false;
		}
		return true;
	};

	const getStatusText = (themeData: AppThemeData, appLanguage: AppLanguage): string => {
		return `theme=${themeData.themeMode}, resolved-dark=${String(themeData.isDark)}, language=${appLanguage}`;
	};

	const refreshTheme = async () => {
		if (!ensureFridayApp()) return;
		try {
			const themeData = await app.getThemeData();
			setTheme(themeData);
			setStatus(`${text.themeRefreshed} (${getStatusText(themeData, language)})`);
		} catch {
			setStatus(text.themeRefreshFailed);
		}
	};

	const refreshLanguage = async () => {
		if (!ensureFridayApp()) return;
		try {
			const appLanguage = await app.getLanguage();
			setLanguage(appLanguage);
			setStatus(`${translations[appLanguage].languageRefreshed} (${getStatusText(theme, appLanguage)})`);
		} catch {
			setStatus(text.languageRefreshFailed);
		}
	};

	const setAppTheme = async (nextTheme: AppTheme) => {
		if (!ensureFridayApp()) return;
		try {
			await app.setTheme(nextTheme);
			await refreshTheme();
			setStatus(`${text.themeSet} ${nextTheme}`);
		} catch {
			setStatus(text.themeSetFailed);
		}
	};

	const setAppLanguage = async (nextLanguage: AppLanguage) => {
		if (!ensureFridayApp()) return;
		try {
			await app.setLanguage(nextLanguage);
			await refreshLanguage();
			setStatus(`${translations[nextLanguage].languageSet} ${nextLanguage}`);
		} catch {
			setStatus(text.languageSetFailed);
		}
	};

	const printThemeData = async () => {
		if (!ensureFridayApp()) return;
		try {
			const themeData = await app.getThemeData();
			setTheme(themeData);
			console.log('Friday app theme data', themeData);
			setStatus(text.printThemeDataSuccess);
		} catch {
			setStatus(text.printThemeDataFailed);
		}
	};

	const testExtensionValueStorage = async () => {
		if (!ensureFridayApp()) return;
		setStorageBusy(true);
		try {
			const expected: DemoStorageValue = { label: 'Friday demo', count: 1 };
			await app.setExtensionStoreValue(demoStorageKey, expected);
			const stored = await app.getExtensionStoreValue<DemoStorageValue>(demoStorageKey);
			if (stored?.label !== expected.label || stored.count !== expected.count) {
				throw new Error('Stored value did not round-trip.');
			}
			await app.deleteExtensionStoreValue(demoStorageKey);
			if ((await app.getExtensionStoreValue(demoStorageKey)) !== undefined) {
				throw new Error('Deleted value is still available.');
			}
			setExtensionStoreValue(JSON.stringify(stored));
			setStatus(text.storageValuePassed);
		} catch (error) {
			setStatus(
				`${text.storageTestFailed}: ${error instanceof Error ? error.message : String(error)}`
			);
		} finally {
			setStorageBusy(false);
		}
	};

	const testExtensionFileStorage = async () => {
		if (!ensureFridayApp()) return;
		setStorageBusy(true);
		try {
			const encoder = new TextEncoder();
			const decoder = new TextDecoder();
			await app.writeExtensionStoreFile(demoStorageFile, encoder.encode('first'));
			if (decoder.decode(await app.readExtensionStoreFile(demoStorageFile)) !== 'first') {
				throw new Error('Stored file did not round-trip.');
			}
			await app.writeExtensionStoreFile(demoStorageFile, encoder.encode('overwritten'));
			const stored = decoder.decode(await app.readExtensionStoreFile(demoStorageFile));
			if (stored !== 'overwritten') throw new Error('Stored file was not overwritten.');
			await app.deleteExtensionStoreFile(demoStorageFile);
			let missingReadRejected = false;
			try {
				await app.readExtensionStoreFile(demoStorageFile);
			} catch {
				missingReadRejected = true;
			}
			if (!missingReadRejected) throw new Error('Deleted file is still available.');
			setExtensionFileValue(stored);
			setStatus(text.storageFilePassed);
		} catch (error) {
			setStatus(
				`${text.storageTestFailed}: ${error instanceof Error ? error.message : String(error)}`
			);
		} finally {
			setStorageBusy(false);
		}
	};

	useEffect(() => {
		if (!isFriday()) return;

		let mounted = true;
		const loadCurrentState = async () => {
			try {
				const [themeData, appLanguage] = await Promise.all([app.getThemeData(), app.getLanguage()]);
				if (!mounted) return;
				setTheme(themeData);
				setLanguage(appLanguage);
				setStatus(`${translations[appLanguage].loaded} (${getStatusText(themeData, appLanguage)})`);
			} catch {
				if (mounted) setStatus(text.loadFailed);
			}
		};
		void loadCurrentState();
		const unsubscribe = app.onThemeModeChanged((themeData) => {
			if (!mounted) return;
			setTheme(themeData);
			setStatus(`${text.themeChanged} (${getStatusText(themeData, language)})`);
		});

		return () => {
			mounted = false;
			unsubscribe();
		};
	}, []);

	return (
		<main className={cn('app-demo overflow-y-auto', theme.isDark && 'dark')} style={themeStyle}>
			<div className="flex min-h-full items-center justify-center p-8">
				<div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
					<p className="text-lg font-semibold">{text.title}</p>
					<p className="text-sm text-muted-foreground">{inFridayApp ? text.connected : text.disconnected}</p>
					<div className="space-y-2">
						<p className="text-sm font-semibold">{text.theme}</p>
						<p className="text-sm">{text.themeMode}: {theme.themeMode}</p>
						<p className="text-sm">{text.resolvedDarkMode}: {theme.isDark ? 'true' : 'false'}</p>
						<div className="mt-2 flex flex-wrap gap-2">
							<Button variant="outline" onClick={() => setAppTheme('light')}>
								{text.setLight}
							</Button>
							<Button variant="outline" onClick={() => setAppTheme('dark')}>
								{text.setDark}
							</Button>
							<Button variant="outline" onClick={() => setAppTheme('system')}>
								{text.setSystem}
							</Button>
							<Button variant="secondary" onClick={refreshTheme}>
								{text.getTheme}
							</Button>
							<Button onClick={printThemeData}>{text.printThemeData}</Button>
						</div>
					</div>
					<div className="space-y-2">
						<p className="text-sm font-semibold">{text.language}</p>
						<p className="text-sm">{text.currentLanguage}: {language}</p>
						<div className="mt-2 flex flex-wrap gap-2">
							<Button variant="outline" onClick={() => setAppLanguage('en')}>
								{text.setEnglish}
							</Button>
							<Button variant="outline" onClick={() => setAppLanguage('it')}>
								{text.setItalian}
							</Button>
							<Button variant="secondary" onClick={refreshLanguage}>
								{text.getLanguage}
							</Button>
						</div>
					</div>
					<div className="space-y-2">
						<p className="text-sm font-semibold">{text.storage}</p>
						<p className="break-all text-sm">
							{text.storageValue}: {extensionStoreValue || text.storageEmpty}
						</p>
						<p className="break-all text-sm">
							{text.storageFile}: {extensionFileValue || text.storageEmpty}
						</p>
						<div className="mt-2 flex flex-wrap gap-2">
							<Button
								variant="outline"
								disabled={storageBusy}
								onClick={testExtensionValueStorage}
							>
								{text.testStorageValue}
							</Button>
							<Button
								variant="secondary"
								disabled={storageBusy}
								onClick={testExtensionFileStorage}
							>
								{text.testStorageFile}
							</Button>
						</div>
					</div>
					<p className="text-sm text-muted-foreground">{text.status}: {status}</p>
					<span className={themeBadgeClass({ variant: theme.isDark ? 'dark' : 'light' })}>
						{theme.isDark ? text.dark : text.light}
					</span>
				</div>
			</div>
		</main>
	);
}
