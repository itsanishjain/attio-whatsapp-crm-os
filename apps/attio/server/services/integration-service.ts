export type IntegrationAuth = {
  apiKey?: string;
  accessToken?: string;
  tokenType?: string | null;
  scope?: string | null;
  tenantName?: string | null;
  accountId?: string | null;
  accountSlug?: string | null;
  userId?: string | null;
  userName?: string | null;
};

export function buildIntegrationAuthJson(auth: IntegrationAuth) {
  return JSON.stringify({
    ...(auth.apiKey ? { apiKey: auth.apiKey } : {}),
    ...(auth.accessToken ? { accessToken: auth.accessToken } : {}),
    ...(auth.tokenType ? { tokenType: auth.tokenType } : {}),
    ...(auth.scope ? { scope: auth.scope } : {}),
    ...(auth.tenantName ? { tenantName: auth.tenantName } : {}),
    ...(auth.accountId ? { accountId: auth.accountId } : {}),
    ...(auth.accountSlug ? { accountSlug: auth.accountSlug } : {}),
    ...(auth.userId ? { userId: auth.userId } : {}),
    ...(auth.userName ? { userName: auth.userName } : {}),
  });
}

export function parseIntegrationAuthJson(authJson: string): IntegrationAuth {
  try {
    const parsed = JSON.parse(authJson) as Record<string, unknown>;

    return {
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : undefined,
      accessToken:
        typeof parsed.accessToken === 'string' ? parsed.accessToken : undefined,
      tokenType: typeof parsed.tokenType === 'string' ? parsed.tokenType : null,
      scope: typeof parsed.scope === 'string' ? parsed.scope : null,
      tenantName:
        typeof parsed.tenantName === 'string' ? parsed.tenantName : null,
      accountId: typeof parsed.accountId === 'string' ? parsed.accountId : null,
      accountSlug:
        typeof parsed.accountSlug === 'string' ? parsed.accountSlug : null,
      userId: typeof parsed.userId === 'string' ? parsed.userId : null,
      userName: typeof parsed.userName === 'string' ? parsed.userName : null,
    };
  } catch {
    return {};
  }
}

export function getIntegrationAccessToken(auth: IntegrationAuth) {
  return auth.accessToken ?? auth.apiKey ?? null;
}
