import { findInstallationById } from '@server/db/queries/installations';
import {
  buildMagicAccessLink,
  createMagicAccessToken,
  getAuthorizedInstallationId,
} from '@server/lib/app-session';
import { getPublicRequestUrl } from '@server/lib/public-request-url';
import { updateGroupSyncSettings } from '@server/services/group-service';
import {
  addInstallationNumberFilterEntry,
  bulkAddInstallationNumberFilterEntries,
  getInstallationSettings,
  listInstallationNumberFilters,
  removeInstallationNumberFilterEntry,
  updateManagedInstallationSettings,
} from '@server/services/installation-settings-service';
import {
  bulkNumberFilterEntriesRequestSchema,
  bulkNumberFilterEntriesResponseSchema,
  commonTimezoneOptions,
  createNumberFilterEntryRequestSchema,
  updateInstallationSettingsRequestSchema,
} from '@shared/schemas/settings';
import { type Context, Hono } from 'hono';

function buildAccessLink(requestUrl: string, installationId: string) {
  return buildMagicAccessLink(
    requestUrl,
    createMagicAccessToken(installationId),
  );
}

async function getAuthorizedInstallation(context: Context) {
  const authorizedInstallationId = getAuthorizedInstallationId(context);
  if (!authorizedInstallationId) return null;
  return findInstallationById(authorizedInstallationId);
}

export const settingsRouter = new Hono()
  .get('/', async (context) => {
    const installation = await getAuthorizedInstallation(context);
    if (!installation) {
      return context.json(
        { ok: false, error: 'Installation not found' } as const,
        404,
      );
    }

    const [settings, numberFilters] = await Promise.all([
      getInstallationSettings(installation.id),
      listInstallationNumberFilters(installation.id),
    ]);

    return context.json({
      ok: true as const,
      settings,
      timezoneOptions: commonTimezoneOptions,
      numberFilters,
      accessLink: buildAccessLink(
        getPublicRequestUrl(context).toString(),
        installation.id,
      ),
    });
  })
  .put('/', async (context) => {
    const installation = await getAuthorizedInstallation(context);
    if (!installation) {
      return context.json(
        { ok: false, error: 'Installation not found' } as const,
        404,
      );
    }

    try {
      const body = updateInstallationSettingsRequestSchema.parse(
        await context.req.json(),
      );
      const settings = await updateManagedInstallationSettings(
        installation.id,
        body,
      );
      const numberFilters = await listInstallationNumberFilters(
        installation.id,
      );

      return context.json({
        ok: true as const,
        settings,
        timezoneOptions: commonTimezoneOptions,
        numberFilters,
        accessLink: buildAccessLink(
          getPublicRequestUrl(context).toString(),
          installation.id,
        ),
      });
    } catch (error) {
      return context.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : 'Invalid request',
        },
        400,
      );
    }
  })
  .post('/number-filters', async (context) => {
    const installation = await getAuthorizedInstallation(context);
    if (!installation) {
      return context.json(
        { ok: false, error: 'Installation not found' } as const,
        404,
      );
    }

    try {
      const body = createNumberFilterEntryRequestSchema.parse(
        await context.req.json(),
      );
      const entry = await addInstallationNumberFilterEntry(
        installation.id,
        body,
      );

      return context.json({ ok: true as const, entry });
    } catch (error) {
      return context.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        400,
      );
    }
  })
  .post('/number-filters/bulk', async (context) => {
    const installation = await getAuthorizedInstallation(context);
    if (!installation) {
      return context.json(
        { ok: false, error: 'Installation not found' } as const,
        404,
      );
    }

    try {
      const body = bulkNumberFilterEntriesRequestSchema.parse(
        await context.req.json(),
      );
      const result = await bulkAddInstallationNumberFilterEntries(
        installation.id,
        body.items,
      );

      return context.json(
        bulkNumberFilterEntriesResponseSchema.parse({
          ok: true,
          ...result,
        }),
      );
    } catch (error) {
      return context.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        400,
      );
    }
  })
  .delete('/number-filters/:id', async (context) => {
    const installation = await getAuthorizedInstallation(context);
    if (!installation) {
      return context.json(
        { ok: false, error: 'Installation not found' } as const,
        404,
      );
    }

    const id = Number(context.req.param('id'));

    if (!Number.isInteger(id) || id <= 0) {
      return context.json(
        { ok: false, error: 'Invalid number filter id' },
        400,
      );
    }

    const deleted = await removeInstallationNumberFilterEntry(
      installation.id,
      id,
    );

    if (!deleted) {
      return context.json({ ok: false, error: 'Number filter not found' }, 404);
    }

    return context.json({ ok: true as const });
  })
  .put('/group-sync', async (context) => {
    const installation = await getAuthorizedInstallation(context);
    if (!installation) {
      return context.json(
        { ok: false, error: 'Installation not found' } as const,
        404,
      );
    }

    try {
      const body = await context.req.json();
      const result = await updateGroupSyncSettings(installation.id, body);
      return context.json({ ok: true as const, settings: result });
    } catch (error) {
      return context.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        400,
      );
    }
  });
