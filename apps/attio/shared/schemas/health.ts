import { z } from 'zod';

export const healthResponseSchema = z.object({
  ok: z.literal(true),
  service: z.literal('attio-crm-whatsapp'),
  database: z.object({
    reachable: z.boolean(),
  }),
  timestamp: z.string().datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
