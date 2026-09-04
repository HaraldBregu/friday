import { useEffect, useState } from 'react';

export function useExtensionWindowState(): boolean {
	const [isMaximized, setIsMaximized] = useState(false);

	useEffect(() => {
		void window.win.isMaximized().then(setIsMaximized);
		return window.win.onMaximizeChange(setIsMaximized);
	}, []);

	return isMaximized;
}
