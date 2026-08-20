import { Check, CircleStop, LoaderCircle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import type { CoderController } from '@/controller';

export function Console({ coder }: { coder: CoderController }) {
	const outputRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const output = outputRef.current;
		if (output) output.scrollTop = output.scrollHeight;
	}, [coder.activities, coder.messages, coder.runLabel]);

	return (
		<div className="coder-terminal">
			<div ref={outputRef} className="terminal-output" role="log" aria-live="polite">
				<div className="terminal-banner">
					<strong>Friday Pi Coder</strong>
					<span>workspace {coder.workingDirectory || 'not configured'}</span>
					<span>provider {coder.providerId}</span>
					<span>model {coder.modelId || 'not selected'}</span>
					<span>tools {coder.toolMode}</span>
				</div>

				{coder.messages.length === 0 ? (
					<p className="terminal-muted">
						Describe one coding task below. Pi will run it in the configured workspace.
					</p>
				) : null}

				{coder.messages.map((message) => (
					<div key={message.id}>
						{message.role === 'assistant' &&
						message.id === coder.messages.at(-1)?.id &&
						coder.activities.length > 0 ? (
							<div className="terminal-activity" aria-label="Coder tools">
								{coder.activities.map((activity) => (
									<div
										key={activity.id}
										className={`terminal-command terminal-command--${activity.status}`}
									>
										{activity.status === 'running' ? (
											<LoaderCircle className="is-spinning" />
										) : activity.status === 'ok' ? (
											<Check />
										) : (
											<X />
										)}
										<strong>{activity.name}</strong>
										<span>{activity.detail}</span>
									</div>
								))}
							</div>
						) : null}
						<div className={`terminal-entry terminal-entry--${message.role}`}>
							{message.role === 'user' ? (
								<>
									<span className="terminal-prompt-label">{coder.workspaceName}</span>
									<span className="terminal-prompt-symbol">$</span>
									<pre>{message.content}</pre>
								</>
							) : (
								<>
									<span className="terminal-agent-label">pi</span>
									{message.content ? (
										<pre className={message.status === 'error' ? 'is-error' : undefined}>
											{message.content}
										</pre>
									) : (
										<span className="terminal-cursor" aria-label="Coder is working" />
									)}
								</>
							)}
						</div>
					</div>
				))}

				{coder.error ? (
					<div className="terminal-error" role="alert">
						error: {coder.error}
					</div>
				) : null}
			</div>

			<form
				className="terminal-input-row"
				onSubmit={(event) => {
					event.preventDefault();
					void coder.send();
				}}
			>
				<label htmlFor="coder-composer">
					<span>{coder.workspaceName}</span>
					<strong>$</strong>
				</label>
				<textarea
					id="coder-composer"
					value={coder.input}
					onChange={(event) => coder.setInput(event.target.value)}
					onKeyDown={(event) => {
						if (event.ctrlKey && event.key.toLowerCase() === 'c' && coder.runState === 'running') {
							event.preventDefault();
							coder.cancelRun();
							return;
						}
						if (event.key === 'Enter' && !event.shiftKey) {
							event.preventDefault();
							void coder.send();
						}
					}}
					placeholder={
						coder.modelId
							? 'Describe a coding task…'
							: 'Configure a Coder model in Friday Settings…'
					}
					aria-label="Coding task"
					rows={1}
				/>
				{coder.runState === 'running' ? (
					<Button
						type="button"
						size="icon"
						variant="ghost"
						aria-label="Stop Coder"
						onClick={coder.cancelRun}
					>
						<CircleStop />
					</Button>
				) : (
					<Button
						type="submit"
						size="sm"
						variant="ghost"
						disabled={!coder.input.trim() || !coder.modelId}
					>
						run
					</Button>
				)}
			</form>
			<footer className="terminal-statusbar">
				<span>
					{coder.runState === 'running'
						? 'ctrl+c to stop'
						: 'enter to run · shift+enter for newline'}
				</span>
				<span>
					{coder.providerId} · {coder.modelId || 'model required'} · {coder.toolMode}
				</span>
			</footer>
		</div>
	);
}
