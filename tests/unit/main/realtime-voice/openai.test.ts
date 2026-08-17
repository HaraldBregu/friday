import {
	OpenAIRealtimeVoiceAdapter,
	type RealtimeVoiceClientEvent,
	type RealtimeVoiceServerEvent,
	type RealtimeVoiceSocket,
} from '../../../../src/main/models/adapters/realtime_voice';

class FakeSocket implements RealtimeVoiceSocket {
	readonly sent: RealtimeVoiceClientEvent[] = [];
	closed = false;
	readonly socket = {
		readyState: 0,
		bufferedAmount: 0,
		on: (event: 'open' | 'close', listener: (...args: unknown[]) => void) => {
			this.socketListeners[event].push(listener);
		},
	};
	private readonly socketListeners = {
		open: [] as Array<() => void>,
		close: [] as Array<() => void>,
	};
	private readonly eventListeners: Array<(event: RealtimeVoiceServerEvent) => void> = [];
	private readonly errorListeners: Array<(error: Error) => void> = [];

	on(
		event: 'event' | 'error',
		listener: ((event: RealtimeVoiceServerEvent) => void) | ((error: Error) => void)
	): void {
		if (event === 'event')
			this.eventListeners.push(listener as (event: RealtimeVoiceServerEvent) => void);
		else this.errorListeners.push(listener as (error: Error) => void);
	}

	send(event: RealtimeVoiceClientEvent): void {
		this.sent.push(event);
	}

	close(): void {
		this.closed = true;
		this.socketListeners.close.forEach((listener) => listener());
	}

	open(): void {
		this.socketListeners.open.forEach((listener) => listener());
	}

	event(event: RealtimeVoiceServerEvent): void {
		this.eventListeners.forEach((listener) => listener(event));
	}
}

describe('OpenAIRealtimeVoiceAdapter', () => {
	it('configures current Realtime audio events and forwards streamed output', async () => {
		const socket = new FakeSocket();
		const adapter = new OpenAIRealtimeVoiceAdapter(
			{ id: 'openai', name: 'OpenAI', apiKey: 'key' },
			() => socket,
			1_000
		);
		const events: Array<{ type: string }> = [];
		const connecting = adapter.connect(
			{
				modelId: 'gpt-realtime-2.1',
				voice: 'marin',
				instructions: 'Help the user.',
				history: [
					{ role: 'user', text: 'Earlier question.' },
					{ role: 'assistant', text: 'Earlier answer.' },
				],
				tools: [
					{
						id: 'read',
						name: 'Read file',
						description: 'Read a file.',
						schema: { type: 'object' },
						timeoutMs: 1_000,
						maxOutputBytes: 1_000,
						parseInput: () => ({}),
						run: () => '',
					},
				],
			},
			(event) => events.push(event)
		);
		socket.open();
		expect(socket.sent[0]).toMatchObject({
			type: 'session.update',
			session: {
				model: 'gpt-realtime-2.1',
				audio: {
					input: {
						format: { type: 'audio/pcm', rate: 24_000 },
						transcription: { model: 'gpt-4o-mini-transcribe' },
						turn_detection: {
							type: 'server_vad',
							silence_duration_ms: 1_200,
							create_response: true,
							interrupt_response: true,
						},
					},
					output: { format: { type: 'audio/pcm', rate: 24_000 }, voice: 'marin' },
				},
				tools: [{ type: 'function', name: 'read' }],
			},
		});
		expect(socket.sent).toHaveLength(1);
		socket.event({ type: 'session.updated' });
		const connection = await connecting;
		expect(socket.sent.slice(1)).toEqual([
			{
				type: 'conversation.item.create',
				item: {
					type: 'message',
					role: 'user',
					content: [{ type: 'input_text', text: 'Earlier question.' }],
				},
			},
			{
				type: 'conversation.item.create',
				item: {
					type: 'message',
					role: 'assistant',
					content: [{ type: 'output_text', text: 'Earlier answer.' }],
				},
			},
		]);
		expect(socket.sent).not.toContainEqual({ type: 'response.create' });
		socket.event({ type: 'session.updated' });
		expect(socket.sent).toHaveLength(3);
		socket.event({
			type: 'conversation.item.input_audio_transcription.completed',
			item_id: 'user-item',
			transcript: 'Please inspect the repository.',
		});
		expect(events).toContainEqual({
			type: 'user_transcript_final',
			itemId: 'user-item',
			transcript: 'Please inspect the repository.',
		});
		socket.event({
			type: 'response.output_audio.delta',
			response_id: 'response',
			item_id: 'item',
			delta: 'AQI=',
		});
		expect(events).toContainEqual({
			type: 'assistant_audio_delta',
			responseId: 'response',
			itemId: 'item',
			audio: 'AQI=',
		});

		await connection.addToolResult('call', 'ok');
		expect(socket.sent.slice(-2)).toEqual([
			{
				type: 'conversation.item.create',
				item: { type: 'function_call_output', call_id: 'call', output: 'ok' },
			},
			{ type: 'response.create' },
		]);

		await connection.interrupt();
		expect(socket.sent.at(-1)).toEqual({ type: 'response.create' });
		socket.event({
			type: 'response.created',
		});
		await connection.interrupt();
		expect(socket.sent.at(-1)).toEqual({ type: 'response.cancel' });

		socket.socket.bufferedAmount = 1_400_000;
		await expect(connection.appendAudio('AAAA')).rejects.toThrow('transport queue is full');
	});

	it('fails startup after the bounded connection timeout', async () => {
		jest.useFakeTimers();
		const socket = new FakeSocket();
		const adapter = new OpenAIRealtimeVoiceAdapter(
			{ id: 'openai', name: 'OpenAI', apiKey: 'key' },
			() => socket,
			15_000
		);
		const connecting = adapter.connect(
			{
				modelId: 'gpt-realtime-2.1-mini',
				voice: 'marin',
				instructions: '',
				history: [],
				tools: [],
			},
			() => undefined
		);
		jest.advanceTimersByTime(15_000);
		await expect(connecting).rejects.toThrow('timed out');
		jest.useRealTimers();
	});

	it('closes and rejects setup immediately when the owner aborts', async () => {
		const socket = new FakeSocket();
		const adapter = new OpenAIRealtimeVoiceAdapter(
			{ id: 'openai', name: 'OpenAI', apiKey: 'key' },
			() => socket,
			15_000
		);
		const controller = new AbortController();
		const connecting = adapter.connect(
			{
				modelId: 'gpt-realtime-2.1',
				voice: 'marin',
				instructions: '',
				history: [],
				tools: [],
			},
			() => undefined,
			controller.signal
		);
		controller.abort(new DOMException('Window closed.', 'AbortError'));

		await expect(connecting).rejects.toThrow('Window closed.');
		expect(socket.closed).toBe(true);
	});
});
