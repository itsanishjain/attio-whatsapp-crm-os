import { groupSyncSelectedGroupSchema } from '@whatsapp-crm/core/schemas/group-sync';
import { z } from 'zod';

export { groupSyncSelectedGroupSchema };

export const syncSharingModeSchema = z.enum(['full_access', 'metadata_only']);
export const numberFilterModeSchema = z.enum(['exclude', 'include']);

export const timezoneOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

export const commonTimezoneOptions = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Sao_Paulo', label: 'Brasilia Time' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Europe/Berlin', label: 'Berlin, Frankfurt' },
  { value: 'Europe/Moscow', label: 'Moscow Time' },
  { value: 'Asia/Dubai', label: 'Dubai, UAE' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Bangkok', label: 'Bangkok, Hanoi' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time' },
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne' },
  { value: 'Pacific/Auckland', label: 'New Zealand' },
] satisfies Array<z.infer<typeof timezoneOptionSchema>>;

export const managedInstallationSettingsSchema = z.object({
  syncSharingMode: syncSharingModeSchema.default('full_access'),
  timezone: z.string().min(1).default('UTC'),
  numberFilterMode: numberFilterModeSchema.default('exclude'),
  includeAutoSyncFromAttio: z.boolean().default(false),
  groupSyncEnabled: z.boolean().default(false),
  groupSyncSelectedGroups: z.array(groupSyncSelectedGroupSchema).default([]),
});

export const numberFilterEntrySchema = z.object({
  id: z.number().int().positive(),
  installationId: z.string(),
  phoneNumber: z.string().min(1),
  normalizedPhone: z.string().min(1),
  reason: z.string().nullable(),
  createdAt: z.string(),
});

export const installationSettingsResponseSchema = z.object({
  ok: z.literal(true),
  settings: managedInstallationSettingsSchema,
  timezoneOptions: z.array(timezoneOptionSchema),
  numberFilters: z.array(numberFilterEntrySchema),
  accessLink: z.string().nullable(),
});

export const updateInstallationSettingsRequestSchema = z
  .object({
    syncSharingMode: syncSharingModeSchema.optional(),
    timezone: z.string().min(1).optional(),
    numberFilterMode: numberFilterModeSchema.optional(),
    includeAutoSyncFromAttio: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message:
      'At least one settings field is required to update installation settings',
  });

export const createNumberFilterEntryRequestSchema = z.object({
  phoneNumber: z.string().min(1),
  reason: z.string().trim().max(200).nullable().optional(),
});

export const bulkNumberFilterEntriesRequestSchema = z.object({
  items: z.array(createNumberFilterEntryRequestSchema).min(1).max(500),
});

export const bulkNumberFilterEntriesResponseSchema = z.object({
  ok: z.literal(true),
  added: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  errors: z.array(z.string()),
});

export type SyncSharingMode = z.infer<typeof syncSharingModeSchema>;
export type NumberFilterMode = z.infer<typeof numberFilterModeSchema>;
export type ManagedInstallationSettings = z.infer<
  typeof managedInstallationSettingsSchema
>;
export type NumberFilterEntry = z.infer<typeof numberFilterEntrySchema>;
