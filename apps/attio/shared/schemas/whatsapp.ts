import {
  baileysConnectionStatusSchema,
  whatsappGroupsResponseSchema,
} from '@whatsapp-crm/core/schemas/baileys';
import { z } from 'zod';

export const whatsappStatusResponseSchema = z.object({
  available: z.boolean(),
  connected: z.boolean(),
  status: baileysConnectionStatusSchema,
  phoneNumber: z.string().nullable(),
  displayName: z.string().nullable(),
  qrCodeDataUrl: z.string().nullable(),
  needsRelink: z.boolean(),
  disconnectCode: z.string().nullable(),
});

export const whatsappConnectResponseSchema = whatsappStatusResponseSchema;

export const whatsappDisconnectResponseSchema = whatsappStatusResponseSchema;
export { whatsappGroupsResponseSchema };

export type WhatsappStatusResponse = z.infer<
  typeof whatsappStatusResponseSchema
>;
export type WhatsappConnectResponse = z.infer<
  typeof whatsappConnectResponseSchema
>;
export type WhatsappDisconnectResponse = z.infer<
  typeof whatsappDisconnectResponseSchema
>;
export type WhatsappGroupsResponse = z.infer<
  typeof whatsappGroupsResponseSchema
>;
