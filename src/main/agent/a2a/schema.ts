import { z } from 'zod';

export const a2aAgentInputSchema = z
	.object({
		id: z.string().trim().min(1).optional(),
		name: z.string(),
		url: z.string().trim().min(1),
		token: z.string().optional(),
		enabled: z.boolean().optional(),
	})
	.strict();
