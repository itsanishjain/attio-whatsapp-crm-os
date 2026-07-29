import {
  DEFAULT_CONNECTION_CONFIG,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';

type SocketVersion = [number, number, number];

const SOCKET_VERSION_FETCH_TIMEOUT_MS = 5_000;

let activeSocketVersion = [
  ...DEFAULT_CONNECTION_CONFIG.version,
] as SocketVersion;
let refreshPromise: Promise<SocketVersion> | null = null;

export function getBaileysSocketVersion(): SocketVersion {
  return [...activeSocketVersion];
}

export async function refreshBaileysSocketVersion(): Promise<SocketVersion> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const request = (async () => {
    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      SOCKET_VERSION_FETCH_TIMEOUT_MS,
    );

    try {
      const { error, isLatest, version } = await fetchLatestBaileysVersion({
        signal: abortController.signal,
      });

      if (error || !isLatest) {
        console.warn(
          `[baileys-runtime] Could not refresh the recommended socket version; continuing with ${activeSocketVersion.join('.')}`,
          error instanceof Error ? error.message : error,
        );
        return getBaileysSocketVersion();
      }

      const nextVersion = [...version] as SocketVersion;
      const changed = nextVersion.join('.') !== activeSocketVersion.join('.');
      activeSocketVersion = nextVersion;

      console.log(
        `[baileys-runtime] ${changed ? 'Updated to' : 'Using'} recommended socket version ${activeSocketVersion.join('.')}`,
      );

      return getBaileysSocketVersion();
    } catch (error) {
      console.warn(
        `[baileys-runtime] Socket version refresh failed; continuing with ${activeSocketVersion.join('.')}`,
        error instanceof Error ? error.message : error,
      );
      return getBaileysSocketVersion();
    } finally {
      clearTimeout(timeout);
    }
  })();

  refreshPromise = request;

  try {
    return await request;
  } finally {
    if (refreshPromise === request) {
      refreshPromise = null;
    }
  }
}
