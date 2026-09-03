import { render, screen } from '@testing-library/react';
import { FileInformation } from '../../../resources/extensions/workspace/src/components/information';

it('renders workspace file size and creation and update dates', () => {
	render(
		<FileInformation
			file={{
				name: 'USER.md',
				path: 'USER.md',
				type: 'file',
				size: 128,
				createdAt: '2026-08-17T10:00:00.000Z',
				updatedAt: '2026-08-18T11:30:00.000Z',
			}}
		/>
	);

	expect(screen.getByText('128 B')).toBeInTheDocument();
	expect(screen.getByText(/^Created /).closest('time')).toHaveAttribute(
		'datetime',
		'2026-08-17T10:00:00.000Z'
	);
	expect(screen.getByText(/^Updated /).closest('time')).toHaveAttribute(
		'datetime',
		'2026-08-18T11:30:00.000Z'
	);
});
