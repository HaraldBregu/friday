import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import '../../../src/renderer/src/i18n';
import { RouteErrorElement } from '../../../src/renderer/src/components/app/base/ErrorBoundary';

it('renders localized copy for an unmatched route', async () => {
	const router = createMemoryRouter(
		[
			{
				path: '*',
				loader: () => {
					throw new Response('Not Found', { status: 404, statusText: 'Not Found' });
				},
				errorElement: <RouteErrorElement />,
			},
		],
		{ initialEntries: ['/missing'] }
	);
	render(<RouterProvider router={router} />);
	expect(await screen.findByText('Page not found')).toBeInTheDocument();
	expect(screen.getByText('The page you requested does not exist.')).toBeInTheDocument();
});
