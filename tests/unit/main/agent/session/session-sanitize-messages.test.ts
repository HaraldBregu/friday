import {
	EXPIRED_SKILL_CONTEXT,
	sanitizeMessages,
} from '../../../../../src/main/agent/session/session_sanitize_messages';
import type { Message } from '../../../../../src/main/agent/types';

describe('sanitizeMessages', () => {
	it('removes interrupted empty assistant turns while preserving valid text and tool calls', () => {
		const toolCall = {
			id: 'tool',
			name: 'read',
			args: { path: 'README.md' },
		};
		const messages: Message[] = [
			{ role: 'user', content: 'first request' },
			{ role: 'assistant', content: '' },
			{ role: 'assistant', content: [{ type: 'text', text: '' }] },
			{ role: 'assistant', content: [{ type: 'provider_item', provider: 'openai', item: {} }] },
			{ role: 'assistant', content: 'partial answer' },
			{ role: 'assistant', content: '', toolCalls: [toolCall] },
			{ role: 'user', content: 'second request' },
		];

		expect(sanitizeMessages(messages)).toEqual([
			messages[0],
			messages[4],
			messages[5],
			messages[6],
		]);
	});

	it('removes prior skill instructions without changing other tool results', () => {
		const messages: Message[] = [
			{ role: 'user', content: 'load a skill' },
			{
				role: 'assistant',
				content: '',
				toolCalls: [
					{
						id: 'skill-1',
						name: 'load_skill',
						args: { name: 'writer' },
						result: { content: '{"content":"stale instructions"}' },
					},
					{
						id: 'read-1',
						name: 'read',
						args: { path: 'file.txt' },
						result: { content: 'file contents' },
					},
				],
			},
		];

		const sanitized = sanitizeMessages(messages);

		expect(sanitized[1].toolCalls?.[0].result?.content).toBe(EXPIRED_SKILL_CONTEXT);
		expect(sanitized[1].toolCalls?.[1].result?.content).toBe('file contents');
		expect(messages[1].toolCalls?.[0].result?.content).toContain('stale instructions');
	});

	it('preserves bodyless activation receipts and structured errors', () => {
		const messages: Message[] = [
			{
				role: 'assistant',
				content: '',
				toolCalls: [
					{
						id: 'ok',
						name: 'load_skill',
						args: { name: 'writer' },
						result: { content: '{"activated":true,"id":"writer"}' },
					},
					{
						id: 'error',
						name: 'load_skill',
						args: { name: 'missing' },
						result: { content: 'Error: missing skill', isError: true },
					},
				],
			},
		];
		const sanitized = sanitizeMessages(messages);
		expect(sanitized[0].toolCalls?.[0].result?.content).toContain('"activated":true');
		expect(sanitized[0].toolCalls?.[1].result).toEqual({
			content: 'Error: missing skill',
			isError: true,
		});
	});
});
