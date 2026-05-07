# Agent Instructions

## Project Shape

This repo contains the Attio WhatsApp CRM integration.

```text
apps/
  attio/        Attio CRM WhatsApp app
```

Default to `apps/attio` for app work.

## Working Defaults

- Root install: `bun install`
- Root dev: `bun run dev`
- Attio app dev: `bun run dev:attio`
- Root typecheck: `bun run typecheck`
- Root lint: `bun run lint`
- Root test: `bun run test`

When working inside the app, prefer running commands from `apps/attio` so the
scope is explicit.

## App Notes

### `apps/attio`

- Main production app.
- Stack includes Hono, React 19, Baileys, Drizzle, and Turso/SQLite.
- Dev mode runs four processes: server, baileys, worker, and frontend.
- Attio-specific CRM logic lives under `apps/attio/server/services`.

## Database And Sync Safety Rules

- Do not proactively work on database tasks unless the user explicitly asks.
- Database migration workflow is owned by the user.
- Do not suggest, remind, or proactively discuss running `db:generate`,
  `db:migrate`, `db:push`, `drizzle-kit generate`, `drizzle-kit push`, or
  production migration/push variants unless the user explicitly asks.
- Do not run schema-changing commands such as `db:migrate`, `db:push`,
  `drizzle-kit generate`, `drizzle-kit push`, or production migration variants
  without explicit user approval.
- Read-only inspection is fine: checking schema files, reading migration files,
  reviewing repositories, and inspecting logs/config.

## Implementation Guidance

- Do not write or include test files (.test.ts, .spec.ts, etc.) unless specifically asked.
- Do not commit changes unless the user explicitly tells you to commit.
- Keep changes scoped to `apps/attio` unless the change is clearly shared.
- Prefer small, local fixes over speculative refactors.
- Verify with the narrowest command that covers the edited area.

## Repository Hygiene

- Avoid adding secrets, private URLs, production tokens, personal data, customer
  data, sensitive business logic, or machine-specific credentials to tracked files.
- Keep real values in ignored local files such as `.env`, `.env.local`, and
  `.env.production`; tracked examples should use placeholders only.
- Before sharing or publishing code, review for secrets, credentials, private
  infrastructure details, customer data, and anything that should not be public.

## Deployment / Ops

- Before using SSH, SCP, Docker Compose, or production credentials, confirm the
  user actually wants deployment or server work.
- For machine-specific deployment notes, check `LOCAL_OPS.md` if it exists.
