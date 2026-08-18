import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormatToggle } from '../../../extensions/workspace/src/components/format-toggle';

it('toggles the formatted Markdown view on and off', async () => {
	const user = userEvent.setup();
	const onFormattedChange = jest.fn();
	const { rerender } = render(
		<FormatToggle formatted={false} onFormattedChange={onFormattedChange} />
	);
	const toggle = screen.getByRole('radio', { name: 'Formatted view' });

	expect(toggle).toHaveAttribute('data-state', 'off');
	await user.click(toggle);
	expect(onFormattedChange).toHaveBeenLastCalledWith(true);

	rerender(<FormatToggle formatted onFormattedChange={onFormattedChange} />);
	expect(toggle).toHaveAttribute('data-state', 'on');
	await user.click(toggle);
	expect(onFormattedChange).toHaveBeenLastCalledWith(false);
});
