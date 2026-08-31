import { render, screen } from '@testing-library/react';
import '../../../src/renderer/src/i18n';
import { RouteErrorElement } from '../../../src/renderer/src/components/app/base/ErrorBoundary';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	isRouteErrorResponse: () => true,
	useRouteError: () => ({
		status: 404,
		statusText: 'Not Found',
		data: 'Not Found',
		internal: true,
	}),
}));

it('renders localized copy for an unmatched route', async () => {
	render(<RouteErrorElement />);
	expect(await screen.findByText('Page not found')).toBeInTheDocument();
	expect(screen.getByText('The page you requested does not exist.')).toBeInTheDocument();
});
