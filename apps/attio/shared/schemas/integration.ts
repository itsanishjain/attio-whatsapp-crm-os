import { z } from 'zod';

export const integrationConnectRequestSchema = z.object({
  apiKey: z.string().min(1),
});

export const integrationConnectResponseSchema = z.object({
  connected: z.literal(true),
  tenant: z.string().min(1),
});

export const integrationOauthStartResponseSchema = z.object({
  ok: z.literal(true),
  authorizationUrl: z.string().url(),
});

export const integrationDisconnectResponseSchema = z.object({
  disconnected: z.literal(true),
});

export const integrationStatusResponseSchema = z.object({
  connected: z.boolean(),
  tenant: z.string().min(1).nullable().optional(),
});

export type IntegrationConnectRequest = z.infer<
  typeof integrationConnectRequestSchema
>;
export type IntegrationConnectResponse = z.infer<
  typeof integrationConnectResponseSchema
>;
export type IntegrationOauthStartResponse = z.infer<
  typeof integrationOauthStartResponseSchema
>;
export type IntegrationDisconnectResponse = z.infer<
  typeof integrationDisconnectResponseSchema
>;
export type IntegrationStatusResponse = z.infer<
  typeof integrationStatusResponseSchema
>;
