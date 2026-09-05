import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadMessagesBySessionId } from '../../../../src/main/agent/session/session_load_messages_by_session_id';
import { realtimeVoiceConversationFactory } from '../../../../src/main/agent/realtime_voice/conversation';
import { realtimeVoiceHistory } from '../../../../src/main/agent/realtime_voice/history';

const SESSION_ID = '11111111-1111-4111-8111-111111111111';

it('persists only finalized voice transcripts at their reserved turn position', () => {
	const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-voice-conversation-'));
	const location = path.join(temporaryRoot, 'agent');
	try {
		const conversation = realtimeVoiceConversationFactory({ location })(SESSION_ID, 'model');
		conversation.beginUserTurn('user-1');
		conversation.addAssistantTranscript('First answer.');
		expect(loadMessagesBySessionId(SESSION_ID, location)).toEqual([
			expect.objectContaining({ role: 'assistant' }),
		]);

		conversation.finalizeUserTurn('user-1', 'First spoken message.');
		conversation.finalizeUserTurn('user-2', 'Second spoken message.');
		conversation.addAssistantTranscript('Second answer.');
		conversation.beginUserTurn('user-2');

		const messages = loadMessagesBySessionId(SESSION_ID, location);
		expect(messages.map((message) => message.role)).toEqual([
			'user',
			'assistant',
			'user',
			'assistant',
		]);
		expect(messages[0].content).toBe('First spoken message.');
		expect(messages[2].content).toBe('Second spoken message.');
		expect(JSON.stringify(messages)).not.toContain('Voice message');
		expect(realtimeVoiceConversationFactory({ location })(SESSION_ID, 'model').history).toEqual([
			{ role: 'user', text: 'First spoken message.' },
			{ role: 'assistant', text: 'First answer.' },
			{ role: 'user', text: 'Second spoken message.' },
			{ role: 'assistant', text: 'Second answer.' },
		]);
	} finally {
		fs.rmSync(temporaryRoot, { recursive: true, force: true });
	}
});

it('bounds replay to the latest 64 messages and 48,000 characters', () => {
	const messages = Array.from({ length: 80 }, (_, index) => ({
		role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
		content: `message-${index}`,
	}));
	const messageBounded = realtimeVoiceHistory(messages);
	expect(messageBounded).toHaveLength(64);
	expect(messageBounded[0].text).toBe('message-16');
	expect(messageBounded.at(-1)?.text).toBe('message-79');

	const oldest = `oldest-prefix-${'A'.repeat(60_000)}-oldest-tail`;
	const characterBounded = realtimeVoiceHistory([
		{ role: 'user', content: oldest },
		{ role: 'assistant', content: 'latest answer' },
	]);
	expect(characterBounded.reduce((total, message) => total + message.text.length, 0)).toBe(48_000);
	expect(characterBounded[0].text.endsWith('-oldest-tail')).toBe(true);
	expect(characterBounded.at(-1)?.text).toBe('latest answer');
});

it('excludes legacy voice placeholders from provider history', () => {
	expect(
		realtimeVoiceHistory([
			{ role: 'user', content: 'Voice message' },
			{ role: 'user', content: 'Actual transcript' },
		])
	).toEqual([{ role: 'user', text: 'Actual transcript' }]);
});

it('preserves updates from text and two voice writers sharing one coordinator', () => {
	const {
		SessionCoordinator,
		init,
		createSessionState,
		addAssistantMessage,
		releaseSession,
	} = require('../../../../src/main/agent/session');
	const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-session-writers-'));
	const config = { location: temporaryRoot };
	const coordinator = new SessionCoordinator();
	const factory = realtimeVoiceConversationFactory(config, coordinator);
	const first = factory(SESSION_ID, 'model');
	const second = factory(SESSION_ID, 'model');
	const text = createSessionState();
	try {
		init(
			text,
			config,
			{ task: 'chat', message: 'Text question.', sessionId: SESSION_ID },
			'main',
			coordinator
		);
		first.addAssistantTranscript('First voice.');
		addAssistantMessage(text, 'Text answer.', []);
		second.addAssistantTranscript('Second voice.');
		const serialized = JSON.stringify(loadMessagesBySessionId(SESSION_ID, temporaryRoot));
		for (const expected of ['Text question.', 'First voice.', 'Text answer.', 'Second voice.']) {
			expect(serialized).toContain(expected);
		}
		releaseSession(text);
		expect(text.lease.signal.aborted).toBe(false);
	} finally {
		first.dispose?.();
		second.dispose?.();
		releaseSession(text);
		fs.rmSync(temporaryRoot, { recursive: true, force: true });
	}
});

it.each(['clear', 'delete', 'edit'])(
	'invalidates old voice and text writers before %s',
	(operation) => {
		const {
			SessionCoordinator,
			init,
			createSessionState,
			addAssistantMessage,
			clearMessages,
			deleteSession,
			updateUserMessageBySessionId,
			appendRun,
			persistSystemPrompt,
			releaseSession,
		} = require('../../../../src/main/agent/session');
		const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-session-invalidated-'));
		const config = { location: temporaryRoot };
		const coordinator = new SessionCoordinator();
		const state = createSessionState();
		init(
			state,
			config,
			{ task: 'chat', message: 'Original question.', sessionId: SESSION_ID },
			'main',
			coordinator
		);
		const voice = realtimeVoiceConversationFactory(config, coordinator)(SESSION_ID, 'model');
		try {
			if (operation === 'clear')
				clearMessages(createSessionState(), config, SESSION_ID, coordinator);
			if (operation === 'delete')
				deleteSession(createSessionState(), config, SESSION_ID, coordinator);
			if (operation === 'edit')
				expect(
					updateUserMessageBySessionId(
						SESSION_ID,
						temporaryRoot,
						0,
						'Edited question.',
						coordinator
					)
				).toBe(true);
			expect(state.lease.signal.aborted).toBe(true);
			expect(voice.signal?.aborted).toBe(true);
			voice.addAssistantTranscript('Late voice callback.');
			addAssistantMessage(state, 'Late text callback.', []);
			appendRun(state, { type: 'run_finished' });
			persistSystemPrompt(state, 'Late system prompt.');
			const serialized = JSON.stringify(loadMessagesBySessionId(SESSION_ID, temporaryRoot));
			expect(serialized).not.toContain('Late');
			if (operation === 'edit') expect(serialized).toContain('Edited question.');
			else expect(serialized).toBe('[]');
			if (operation === 'delete')
				expect(fs.existsSync(path.join(state.sessionsPath, state.folderName))).toBe(false);
		} finally {
			voice.dispose?.();
			releaseSession(state);
			fs.rmSync(temporaryRoot, { recursive: true, force: true });
		}
	}
);
