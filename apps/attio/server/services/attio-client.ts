import { env } from '@server/env';

export type AttioRecord = {
  id: {
    record_id: string;
    object_id?: string;
    workspace_id?: string;
  };
  values?: Record<string, unknown>;
};

export type AttioNote = {
  id: {
    note_id: string;
    workspace_id?: string;
  };
  title?: string;
  content_markdown?: string;
  content_plaintext?: string;
};

export type AttioWorkspaceMember = {
  id: {
    workspace_id: string;
    workspace_member_id: string;
  };
  first_name?: string | null;
  last_name?: string | null;
  email_address?: string | null;
  access_level?: string | null;
};

type AttioListResponse<T> = {
  data?: T;
};

const WHATSAPP_ATTRIBUTE_CONFIGS = [
  {
    slug: 'whatsapp_phone_number',
    config: {
      title: 'WhatsApp Phone Number',
      type: 'text',
      description: 'Raw WhatsApp phone number used for matching.',
    },
  },
  {
    slug: 'whatsapp_last_message_at',
    config: {
      title: 'Last WhatsApp Message At',
      type: 'timestamp',
      description: 'Timestamp of the latest WhatsApp activity.',
    },
  },
  {
    slug: 'whatsapp_last_message_direction',
    config: {
      title: 'Last WhatsApp Message Direction',
      type: 'text',
      description: 'Direction of the latest synced WhatsApp message.',
    },
  },
  {
    slug: 'whatsapp_last_message_text',
    config: {
      title: 'Last WhatsApp Message Text',
      type: 'text',
      description: 'Text snapshot of the latest synced WhatsApp message.',
    },
  },
  {
    slug: 'whatsapp_conversation_link',
    config: {
      title: 'WhatsApp Conversation',
      type: 'text',
      description: 'WhatsApp deep link for this contact.',
    },
  },
];

function ensurePlusPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits ? `+${digits}` : phone.trim();
}

function unwrapAttioData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as AttioListResponse<T>).data as T;
  }

  return payload as T;
}

export class AttioClient {
  constructor(private readonly accessToken: string) {}

  private async request<T>(path: string, init: RequestInit = {}) {
    const baseUrl = env.ATTIO_API_URL.endsWith('/')
      ? env.ATTIO_API_URL
      : `${env.ATTIO_API_URL}/`;
    const response = await fetch(new URL(path.replace(/^\/+/, ''), baseUrl), {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Attio API failed with ${response.status}: ${body}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return unwrapAttioData<T>(await response.json());
  }

  async getWorkspaceMembers() {
    try {
      const members =
        await this.request<AttioWorkspaceMember[]>('/workspace_members');
      return Array.isArray(members) ? members : [];
    } catch {
      return [];
    }
  }

  async getWorkspaceLabel() {
    const members = await this.getWorkspaceMembers();
    const firstMember = members[0];
    const workspaceId = firstMember?.id.workspace_id ?? null;
    const email = firstMember?.email_address ?? null;

    return {
      providerAccountId: workspaceId ?? email ?? null,
      tenantName: workspaceId ?? email ?? 'Attio workspace',
      userName:
        [firstMember?.first_name, firstMember?.last_name]
          .filter(Boolean)
          .join(' ')
          .trim() || email,
    };
  }

  async findPersonByPhone(phone: string) {
    const candidates = Array.from(
      new Set([phone.trim(), phone.replace(/\D/g, ''), ensurePlusPhone(phone)]),
    ).filter(Boolean);

    for (const candidate of candidates) {
      const records = await this.request<AttioRecord[]>(
        '/objects/people/records/query',
        {
          method: 'POST',
          body: JSON.stringify({
            filter: {
              $or: [
                { phone_numbers: { $contains: candidate } },
                { whatsapp_phone_number: { $contains: candidate } },
              ],
            },
            limit: 1,
          }),
        },
      );

      if (records[0]) {
        return records[0];
      }
    }

    return null;
  }

  async createPerson(input: {
    phone: string;
    name?: string | null;
    values?: Record<string, unknown>;
  }) {
    const phone = ensurePlusPhone(input.phone);
    const values: Record<string, unknown> = {
      ...input.values,
      whatsapp_phone_number: phone,
    };

    if (input.name) {
      values.name = input.name;
    }

    return this.request<AttioRecord>('/objects/people/records', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          values,
        },
      }),
    });
  }

  async findOrCreateGroupPerson(groupJid: string, groupName: string) {
    const records = await this.request<AttioRecord[]>(
      '/objects/people/records/query',
      {
        method: 'POST',
        body: JSON.stringify({
          filter: {
            whatsapp_phone_number: { $eq: groupJid },
          },
          limit: 1,
        }),
      },
    ).catch(() => []);

    if (records[0]) {
      return records[0];
    }

    return this.createPerson({
      phone: groupJid,
      name: groupName,
      values: {
        whatsapp_phone_number: groupJid,
      },
    });
  }

  async updatePerson(recordId: string, values: Record<string, unknown>) {
    return this.request<AttioRecord>(`/objects/people/records/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          values,
        },
      }),
    });
  }

  async createNote(input: {
    parentObject: string;
    parentRecordId: string;
    title: string;
    content: string;
  }) {
    return this.request<AttioNote>('/notes', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          parent_object: input.parentObject,
          parent_record_id: input.parentRecordId,
          title: input.title,
          format: 'plaintext',
          content: input.content,
          created_at: new Date().toISOString(),
        },
      }),
    });
  }

  async getNote(noteId: string) {
    try {
      return await this.request<AttioNote>(`/notes/${noteId}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async deleteNote(noteId: string) {
    await this.request<void>(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  async replaceNote(input: {
    noteId: string;
    parentObject: string;
    parentRecordId: string;
    title: string;
    content: string;
  }) {
    await this.deleteNote(input.noteId);
    return this.createNote(input);
  }

  async getAttributeDetails(attributeSlug: string) {
    try {
      return await this.request<{ type?: string; is_archived?: boolean }>(
        `/objects/people/attributes/${attributeSlug}`,
      );
    } catch {
      return null;
    }
  }

  async listSelectOptions(attributeSlug: string) {
    try {
      const options = await this.request<
        Array<{ title?: string; api_slug?: string }>
      >(`/objects/people/attributes/${attributeSlug}/options`);
      return Array.isArray(options) ? options : [];
    } catch {
      return [];
    }
  }

  async addSelectOption(
    attributeSlug: string,
    option: { title: string; api_slug: string },
  ) {
    await this.request(`/objects/people/attributes/${attributeSlug}/options`, {
      method: 'POST',
      body: JSON.stringify({
        data: option,
      }),
    });
  }

  async ensureSelectOptions(
    attributeSlug: string,
    options: Array<{ title: string; api_slug: string }>,
  ) {
    const existingOptions = await this.listSelectOptions(attributeSlug);
    const existingTitles = new Set(
      existingOptions
        .map((option) => option.title?.toLowerCase())
        .filter(Boolean),
    );
    const existingSlugs = new Set(
      existingOptions
        .map((option) => option.api_slug?.toLowerCase())
        .filter(Boolean),
    );

    for (const option of options) {
      if (
        existingTitles.has(option.title.toLowerCase()) ||
        existingSlugs.has(option.api_slug.toLowerCase())
      ) {
        continue;
      }

      await this.addSelectOption(attributeSlug, option);
    }
  }

  async ensureWhatsappAttributes() {
    for (const attribute of WHATSAPP_ATTRIBUTE_CONFIGS) {
      const exists = await this.request<unknown>(
        `/objects/people/attributes/${attribute.slug}`,
      )
        .then(() => true)
        .catch(() => false);

      if (exists) {
        continue;
      }

      await this.request('/objects/people/attributes', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            api_slug: attribute.slug,
            is_required: false,
            is_unique: false,
            is_multiselect: false,
            config: {},
            ...attribute.config,
          },
        }),
      }).catch((error) => {
        if (
          error instanceof Error &&
          (error.message.includes('slug_conflict') ||
            error.message.includes('already exists'))
        ) {
          return;
        }
        throw error;
      });
    }

    const directionAttribute = await this.getAttributeDetails(
      'whatsapp_last_message_direction',
    );
    if (directionAttribute?.type === 'select') {
      await this.ensureSelectOptions('whatsapp_last_message_direction', [
        { title: 'Inbound', api_slug: 'inbound' },
        { title: 'Outbound', api_slug: 'outbound' },
      ]);
    }
  }
}
