import type { Context } from 'hono';

function getForwardedHeader(context: Context, name: string) {
  return context.req.header(name)?.split(',')[0]?.trim();
}

export function getPublicRequestUrl(context: Context) {
  const requestUrl = new URL(context.req.url);
  const forwardedProto = getForwardedHeader(context, 'x-forwarded-proto');
  const forwardedHost = getForwardedHeader(context, 'x-forwarded-host');
  const hostHeader = getForwardedHeader(context, 'host');

  const resolvedHost = forwardedHost ?? hostHeader ?? requestUrl.host;

  if (!resolvedHost) {
    return requestUrl;
  }

  requestUrl.protocol = `${forwardedProto ?? requestUrl.protocol.replace(':', '')}:`;
  const parsedHost = new URL(`${requestUrl.protocol}//${resolvedHost}`);
  requestUrl.hostname = parsedHost.hostname;
  requestUrl.port = parsedHost.port;

  return requestUrl;
}

export function buildPublicUrl(context: Context, path: string) {
  return new URL(path, getPublicRequestUrl(context)).toString();
}
