import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProvider, AuthProvider } from './contexts';
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
				<AuthProvider>
					<PageProvider>
						<RouterProvider router={router} />
					</PageProvider>
				</AuthProvider>
			</AppProvider>
		</ErrorBoundary>
	);
};

export default App;
