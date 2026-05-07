# Attio CRM WhatsApp

Attio-specific WhatsApp CRM app inside the monorepo. It runs its own Hono
server, React frontend, and Baileys session runtime, with Drizzle managing the
SQLite/Turso schema.

## Stack

Bun, Hono, React 19, Drizzle ORM, Turso (SQLite in dev), split Baileys service,
TailwindCSS

## Architecture

Four processes in development, three containers in deployment:

- **App** (local/container port `3000`, host port `3030`) - Hono API + static React frontend.
- **Baileys** (local/container port `3001`, host port `3031`) - Dedicated WhatsApp connection manager and session restore process.
- **Worker** - Background Attio sync and audio transcoding worker.
- **Turso/SQLite** - Turso in prod, local SQLite file in dev.

## Commands

```sh
bun install
bun run dev
bun run docker:build
bun run docker:up
bun run deploy:server
bun run lint
bun run typecheck
bun run test
```

## OAuth setup

To enable the Attio dashboard `Connect Attio` flow, configure these server env
vars:

- `ATTIO_CLIENT_ID`
- `ATTIO_CLIENT_SECRET`
- `ATTIO_REDIRECT_URI`
- `ATTIO_OAUTH_STATE_SECRET`

Optional:

- `ATTIO_SCOPES`
- `ATTIO_OAUTH_AUTHORIZE_URL`
- `ATTIO_OAUTH_TOKEN_URL`
- `ATTIO_API_URL`

Your Attio app's redirect URL should point at the app callback route, for
example:

```text
https://your-domain.com/api/integration/oauth/callback
```

## Deployment

Attio deploys with a dedicated worker container:

- `Dockerfile` builds separate `app`, `baileys`, and `worker` targets.
- `docker-compose.yml` exposes host ports `3030` and `3031`, while the containers still use the standard internal ports `3000` and `3001`.
- The app talks to the Baileys container at `http://baileys:3001` inside Docker.
- `scripts/server-bootstrap.sh` installs Docker and clones the repo on a new
  box.
- `scripts/server-deploy.sh` fast-forwards the checkout and rebuilds the
  Attio app stack.
- `deploy/nginx/` contains the matching reverse-proxy config.

## Database workflow

Database schema changes are manual by design.

- Local dev can use SQLite for speed.
- Production uses Turso.
- Build and deploy do not run `db:generate`, `db:migrate`, or `db:push`.
- If you want to change the schema, run the Drizzle commands yourself when you decide to.
