import React, { useMemo, useRef, useState } from 'react';
import { Box, Static, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { parseTuiCommand } from './parse.js';
import type { InstallOptions, InstallResult } from './types.js';

export interface TuiProps {
	readonly install: (spec: string, options?: InstallOptions) => Promise<InstallResult>;
	readonly launch: () => Promise<void>;
}

interface Message {
	readonly id: number;
	readonly text: string;
	readonly type: 'error' | 'info' | 'success';
}

const COMMANDS = ['/install', '/app', '/help', '/clear', '/quit'] as const;
const HELP = '/install <package>  /app  /clear  /quit';

export function KucedrTui({ install, launch }: TuiProps): React.JSX.Element {
	const { exit } = useApp();
	const nextId = useRef(1);
	const [messages, setMessages] = useState<Message[]>([
		{ id: 0, text: 'Kucedr terminal is ready. Type /help for commands.', type: 'info' },
	]);
	const [input, setInput] = useState('');
	const [status, setStatus] = useState('');
	const suggestions = useMemo(() => {
		if (!input.startsWith('/') || input.includes(' ')) return [];
		return COMMANDS.filter((command) => command.startsWith(input));
	}, [input]);

	const addMessage = (text: string, type: Message['type']): void => {
		setMessages((current) => [...current, { id: nextId.current++, text, type }]);
	};

	const submit = async (value: string): Promise<void> => {
		const command = parseTuiCommand(value);
		setInput('');

		if (command.kind === 'clear') {
			setMessages([]);
			return;
		}
		if (command.kind === 'help') {
			addMessage(HELP, 'info');
			return;
		}
		if (command.kind === 'quit') {
			exit();
			return;
		}
		if (command.kind === 'unknown') {
			addMessage(`Unknown command: ${command.input || '(empty)'}`, 'error');
			return;
		}

		try {
			if (command.kind === 'app') {
				setStatus('Launching Kucedr…');
				await launch();
				addMessage('Kucedr desktop app launched.', 'success');
				return;
			}

			setStatus(`Installing ${command.spec}…`);
			const result = await install(command.spec, { force: command.force });
			addMessage(
				`Installed ${result.name} ${result.version}. Restart Kucedr to activate it.`,
				'success'
			);
		} catch (error) {
			addMessage(error instanceof Error ? error.message : 'The command failed.', 'error');
		} finally {
			setStatus('');
		}
	};

	useInput((character, key) => {
		if (key.ctrl && character === 'c') exit();
		if (key.tab && suggestions[0]) setInput(`${suggestions[0]} `);
	});

	return (
		<Box flexDirection="column" paddingX={1}>
			<Text bold color="magenta">
				Kucedr
			</Text>
			<Static items={messages}>
				{(message) => (
					<Text
						key={message.id}
						color={
							message.type === 'error' ? 'red' : message.type === 'success' ? 'green' : undefined
						}
					>
						{message.type === 'success' ? '✓ ' : message.type === 'error' ? '✗ ' : '  '}
						{message.text}
					</Text>
				)}
			</Static>
			{status ? <Text color="yellow">{status}</Text> : null}
			{suggestions.length > 0 ? <Text dimColor>{suggestions.join('  ')}</Text> : null}
			<Box>
				<Text color="magenta">› </Text>
				<TextInput
					value={input}
					onChange={setInput}
					onSubmit={(value) => void submit(value)}
					placeholder="/install package-one"
				/>
			</Box>
		</Box>
	);
}
