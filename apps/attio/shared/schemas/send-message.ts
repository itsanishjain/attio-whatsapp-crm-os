import { z } from 'zod';

const trimmedString = z.string().trim().min(1);
const optionalTrimmedString = z.string().trim().optional();
const httpsUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => value.startsWith('https://'), {
    message: 'Media URL must use https',
  });
const mentionList = z.array(trimmedString).min(1).optional();
const replyToMessageId = trimmedString.optional();
const viewOnceFlag = z.boolean().optional();

export const mediaSourceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('external_url'),
    url: httpsUrl,
  }),
  z.object({
    type: z.literal('r2_object'),
    objectKey: trimmedString,
  }),
]);

export const contactCardSchema = z.object({
  fullName: trimmedString,
  phoneNumber: trimmedString,
  organization: optionalTrimmedString,
});

export const sendMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    phoneNumber: trimmedString,
    text: trimmedString,
    mentions: mentionList,
    replyToMessageId,
    linkPreview: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('image'),
    phoneNumber: trimmedString,
    media: mediaSourceSchema,
    caption: optionalTrimmedString,
    mentions: mentionList,
    replyToMessageId,
    viewOnce: viewOnceFlag,
  }),
  z.object({
    type: z.literal('video'),
    phoneNumber: trimmedString,
    media: mediaSourceSchema,
    caption: optionalTrimmedString,
    mentions: mentionList,
    replyToMessageId,
    viewOnce: viewOnceFlag,
    gifPlayback: z.boolean().optional(),
    ptv: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('audio'),
    phoneNumber: trimmedString,
    media: mediaSourceSchema,
    replyToMessageId,
    mimetype: optionalTrimmedString,
    ptt: z.boolean().optional(),
    seconds: z.number().int().positive().max(3600).optional(),
  }),
  z.object({
    type: z.literal('sticker'),
    phoneNumber: trimmedString,
    media: mediaSourceSchema,
    replyToMessageId,
    isAnimated: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('document'),
    phoneNumber: trimmedString,
    media: mediaSourceSchema,
    replyToMessageId,
    viewOnce: viewOnceFlag,
    mimetype: trimmedString,
    fileName: optionalTrimmedString,
    caption: optionalTrimmedString,
  }),
  z.object({
    type: z.literal('location'),
    phoneNumber: trimmedString,
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    name: optionalTrimmedString,
    address: optionalTrimmedString,
    replyToMessageId,
  }),
  z.object({
    type: z.literal('contacts'),
    phoneNumber: trimmedString,
    contacts: z.array(contactCardSchema).min(1),
    displayName: optionalTrimmedString,
    replyToMessageId,
  }),
  z.object({
    type: z.literal('reaction'),
    phoneNumber: trimmedString,
    targetWhatsappMessageId: trimmedString,
    emoji: z.string(),
  }),
]);

export const sendRequestSchema = z.object({
  message: sendMessageSchema,
});

export const sendResponseSchema = z.object({
  accepted: z.literal(true),
  messageId: z.string().nullable(),
  remoteJid: z.string(),
});

export type MediaSource = z.infer<typeof mediaSourceSchema>;
export type ContactCard = z.infer<typeof contactCardSchema>;
export type SendMessage = z.infer<typeof sendMessageSchema>;
export type SendRequest = z.infer<typeof sendRequestSchema>;
export type SendResponse = z.infer<typeof sendResponseSchema>;
