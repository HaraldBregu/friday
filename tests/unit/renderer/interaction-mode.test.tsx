import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useInteractionMode } from '../../../src/renderer/src/pages/home/hooks/mode';

function Harness({ sessionId }: { readonly sessionId: string }) {
	const mode = useInteractionMode(sessionId);
	return (
		<>
			<output>{mode.interactionMode}</output>
			<button type="button" onClick={() => mode.setInteractionMode('plan')}>
				Plan
			</button>
			<button type="button" onClick={() => mode.migrateInteractionMode('resolved')}>
				Migrate
			</button>
			<button type="button" onClick={() => mode.finishInteractionModeMigration('resolved')}>
				Finish
			</button>
		</>
	);
}

beforeEach(() => localStorage.clear());

it('defaults new conversations and persists modes per conversation', async () => {
	const user = userEvent.setup();
	const view = render(<Harness sessionId="first" />);
	expect(screen.getByText('default')).toBeInTheDocument();
	await user.click(screen.getByRole('button', { name: 'Plan' }));
	expect(screen.getByText('plan')).toBeInTheDocument();

	view.rerender(<Harness sessionId="second" />);
	expect(screen.getByText('default')).toBeInTheDocument();
	view.rerender(<Harness sessionId="first" />);
	expect(screen.getByText('plan')).toBeInTheDocument();
});

it('migrates the home alias mode to the resolved session key', async () => {
	const user = userEvent.setup();
	const view = render(<Harness sessionId="home" />);
	await user.click(screen.getByRole('button', { name: 'Plan' }));
	await user.click(screen.getByRole('button', { name: 'Migrate' }));

	view.rerender(<Harness sessionId="resolved" />);
	expect(screen.getByText('plan')).toBeInTheDocument();
	const stored = JSON.parse(localStorage.getItem('kucedr-interaction-modes') ?? '{}');
	expect(stored).toEqual({ home: 'plan', resolved: 'plan' });

	view.rerender(<Harness sessionId="home" />);
	await user.click(screen.getByRole('button', { name: 'Finish' }));
	expect(JSON.parse(localStorage.getItem('kucedr-interaction-modes') ?? '{}')).toEqual({
		resolved: 'plan',
	});
});
