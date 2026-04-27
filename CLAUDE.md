# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` — start Nuxt dev server (default `http://localhost:3000`)
- `pnpm build` — production build into `.output/`
- `pnpm preview` — preview the production build
- `pnpm lint` — ESLint via `@nuxt/eslint` (`stylistic: { commaDangle: 'never', braceStyle: '1tbs' }`)
- `pnpm typecheck` — `nuxt typecheck` (vue-tsc)
- `pnpm db:generate` — Drizzle Kit generates a new migration from `server/database/schema.ts` into `server/database/migrations/`. **Never hand-write migration files; always use this command.**
- `pnpm db:migrate` — apply migrations against `DATABASE_URL` (production servers don't need this; the Nitro plugin runs migrations on boot)
- `pnpm deploy` — `./deploy.sh`: SSHes to the prod box and runs `git pull && pnpm install && pnpm build && pm2 reload ecosystem.config.cjs --update-env`. Use `pm2 reload ecosystem.config.cjs --update-env` (not `restart`) so PM2 picks up changed `.env` values.

There is no test runner configured.

### Dev auth shortcut

Set `NUXT_DEV_AUTO_LOGIN=1` and hit `/api/_dev/login?email=…&name=…&redirect=/` to log in without Google. The endpoint 404s without that env flag.

## Architecture

Nuxt 4 monolith: SPA frontend (`app/`) + Nitro server routes (`server/`) backed by PostgreSQL via Drizzle ORM (`postgres-js` driver).

### Data model (`server/database/schema.ts`)

Three tables, all keyed by `userId`:

- **`users`** — Google OAuth identity (`googleId` unique). Created on first sign-in.
- **`activities`** — user-defined named/colored buckets. Soft-deleted via `archivedAt` (entries reference them with `onDelete: 'restrict'` so archived activities can't be hard-deleted while history exists).
- **`entries`** — one logged block. Either references an `activityId` *or* carries a freeform `name` (mutually exclusive — `[id].patch.ts` enforces this by nulling the other field). `date` is a `text` `YYYY-MM-DD` (no timezone), `blocks` is `0.5` or `1`, `position` orders entries within a single day.

The "either activity or freeform name" pattern is load-bearing — `stats.get.ts` aggregates activity-backed entries (joined) and freeform entries (`isNull(activityId)` grouped by `name`) separately.

### Auth

Session-based via `nuxt-auth-utils`. `app/middleware/auth.global.ts` redirects unauthenticated users to `/login` (and authenticated users away from `/login`). Server endpoints call `requireUserId(event)` from `server/utils/session.ts` — every query is scoped by `userId`. The Google OAuth callback at `server/routes/auth/google.get.ts` upserts the user row, seeds default activities for new users (`server/utils/seed.ts`), and sets the session.

The `User` and `UserSession` shapes are augmented in `shared/auth.d.ts` (module declaration for `#auth-utils`).

### DB client and migrations

`useDb()` in `server/database/client.ts` is a lazy singleton — it reads `DATABASE_URL` from `useRuntimeConfig()` on first call and memoizes the Drizzle instance. Always import `{ useDb, schema }` from there; don't construct postgres clients elsewhere.

Migrations run automatically on server boot via `server/plugins/migrate.ts` (a Nitro plugin pointing at `server/database/migrations`). The dev workflow is: edit `schema.ts` → `pnpm db:generate` → restart dev server (migration applies on next boot).

### Frontend

- `app/pages/index.vue` is the main calendar view; it picks day/workweek/week/month layouts from `useViewMode()` (cookie-persisted) and breakpoints. Mobile is always day view.
- `app/composables/useWeek.ts` holds all date math — `YYYY-MM-DD` strings are the lingua franca; never pass `Date` objects across boundaries. Week starts Monday.
- `app/composables/useEntries.ts` / `useActivities.ts` are `useFetch` wrappers with `server: false` (data is always client-fetched after auth resolves).
- Drag-to-reorder uses `@vueuse/integrations/useSortable` (sortablejs); reordering issues parallel PATCHes for each changed `position`.
- Activity colors are stored as hex with alpha (e.g. `#64748b52`) — migration `0003_activity_color_alpha.sql` widened the column for this.

### Conventions

- Path aliases: `~/` → `app/`, `~~/` → repo root. Use `~~/server/...` from server code, `~/composables/...` from app code.
- `defineEventHandler`, `useDb`, `requireUserId`, `defineNuxtRouteMiddleware`, etc. are auto-imported by Nuxt — don't add explicit imports for them.
- Tailwind v4 + `@nuxt/ui` v4 for all components; icons via `@iconify-json/lucide` (`i-lucide-*`).

## Deployment

PM2 fork mode, single instance, `max_memory_restart: 256M`. `ecosystem.config.cjs` reads `.env` directly and merges it into the PM2 env so `--update-env` reload picks up changes. App listens on `HOST:PORT` (defaults `127.0.0.1:3000` locally, `127.0.0.1:3001` on the deployed server) — front it with nginx + TLS. Google OAuth redirect URI must match the deployed domain (`https://your-domain/auth/google`).
