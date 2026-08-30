import { z } from 'zod';

export const a2aAgentInputSchema = z
	.object({
		id: z.string().trim().min(1).max(200).optional(),
		name: z.string().max(200),
		url: z.string().trim().min(1).max(2048),
		authType: z.enum(['none', 'bearer', 'api-key']).optional(),
		credential: z.string().max(8192).optional(),
		apiKeyHeader: z
			.string()
			.trim()
			.min(1)
			.max(128)
			.regex(/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/)
			.refine(
				(value) =>
					!['a2a-extensions', 'a2a-version', 'connection', 'content-length', 'host', 'transfer-encoding'].includes(
						value.toLowerCase()
					),
				'A2A API key header is reserved or unsafe.'
			)
			.optional(),
		token: z.string().max(8192).optional(),
		enabled: z.boolean().optional(),
	})
	.strict()
	.refine((value) => value.credential === undefined || value.token === undefined, {
		message: 'Use credential instead of providing both credential and token.',
	});
