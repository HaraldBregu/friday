import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from './contexts';
import { ErrorBoundary } from './components/app/base/ErrorBoundary';
import { initRecorderCapture } from './lib/recorder';
import { router } from './router';
import { Provider as PageProvider } from './components/app/base/page';
import './index.css';

const App: React.FC = () => {
	useEffect(() => initRecorderCapture(), []);

	return (
		<ErrorBoundary level="root">
			<AppProvider>
				<PageProvider>
					<RouterProvider router={router} />
				</PageProvider>
			</AppProvider>
		</ErrorBoundary>
	);
};

export default App;
