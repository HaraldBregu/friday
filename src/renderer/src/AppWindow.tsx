import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ExtensionShell } from './components/app/titlebar/ExtensionShell';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Impossible to find the extension root element');

const encodedTitle = window.location.hash.replace(/^#\/?extension\//, '');
const title = encodedTitle ? decodeURIComponent(encodedTitle) : 'Extension';

createRoot(rootElement).render(
	<StrictMode>
		<ExtensionShell title={title} />
	</StrictMode>
);
