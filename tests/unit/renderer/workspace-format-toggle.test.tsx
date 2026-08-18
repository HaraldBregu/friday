import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormatToggle } from '../../../extensions/workspace/src/components/format-toggle';

jest.mock('../../../extensions/workspace/src/components/ui/toggle-group', () => {
	const React = jest.requireActual<typeof import('react')>('react');
	type ToggleGroupProps = {
		'aria-label'?: string;
		children: import('react').ReactElement<{ value: string }>;
		onValueChange: (value: string) => void;
		type: 'single';
		value: string;
	};

	return {
		ToggleGroup: ({ children, onValueChange, value, ...props }: ToggleGroupProps) =>
			React.createElement(
				'div',
				{ 'aria-label': props['aria-label'] },
				React.cloneElement(children, {
					'data-state': value === children.props.value ? 'on' : 'off',
					onClick: () => onValueChange(value ? '' : children.props.value),
				})
			),
	};
});

jest.mock('../../../extensions/workspace/src/components/ui/toggle-item', () => ({
	ToggleGroupItem: (
		props: import('react').ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
	) => <button type="button" {...props} />,
}));

it('toggles the formatted Markdown view on and off', async () => {
	const user = userEvent.setup();
	const onFormattedChange = jest.fn();
	const { rerender } = render(
		<FormatToggle formatted={false} onFormattedChange={onFormattedChange} />
	);
	const toggle = screen.getByRole('button', { name: 'Formatted view' });

	expect(toggle).toHaveAttribute('data-state', 'off');
	await user.click(toggle);
	expect(onFormattedChange).toHaveBeenLastCalledWith(true);

	rerender(<FormatToggle formatted onFormattedChange={onFormattedChange} />);
	expect(toggle).toHaveAttribute('data-state', 'on');
	await user.click(toggle);
	expect(onFormattedChange).toHaveBeenLastCalledWith(false);
});
