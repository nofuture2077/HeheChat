# CLAUDE.md

## Workflow rules

- Keep changes minimal — touch only what the task requires.
- Base all work on the `release` branch (not `main`).
- For every change, create a new branch off `release`:
  - `feature/<short-name>` for new features
  - `bugfix/<short-name>` for fixes
- Bump the `version` field in [package.json](package.json) for every change.

## Project overview

HeheChat is a Twitch chat/streaming companion app built with Vite + React 19 + TypeScript + Mantine v9. It integrates with Twitch (via Twurple), OBS (via obs-websocket-js), and a backend API (`VITE_BACKEND_URL`).

Package manager: **yarn 4.3.1**.

## Entry points

The app ships multiple Vite entry points, each producing a standalone bundle:

- [index.html](index.html) → [src/main.tsx](src/main.tsx) — main chat app (`HeheChatApp`)
- [admin.html](admin.html) → [src/admin.tsx](src/admin.tsx) — admin dashboard (alerts, analytics, channels, premium)
- [alert.html](alert.html) → [src/alerts.tsx](src/alerts.tsx) — OBS browser source for alerts (`BrowserSourceApp`)
- [replay.html](replay.html) → [src/replay.tsx](src/replay.tsx) — alert replay viewer
- [collection.html](collection.html) → [src/collection.tsx](src/collection.tsx) — sprite/emote collection viewer
- [switcher.html](switcher.html) → [src/switcher.ts](src/switcher.ts) — OBS scene/stream-state synchronizer

Browser sources (alert, switcher) authenticate via URL hash parameters (token, preview flags) — not the normal login flow.

## Source layout

- [src/components/](src/components/) — UI components organized by domain (chat, alerts, settings, emote, browsersource, …)
- [src/pages/](src/pages/) — page-level components, suffixed `.page.tsx` or named `*Page.tsx`
- [src/api/](src/api/) — one file per backend domain (analytics, emotes, bot, premium, channels, news, sprites, switcher)
- [src/hooks/](src/hooks/) — custom React hooks (e.g. `useVersionCheck`, `useWakeLock`, `useChannels`)
- [src/commons/](src/commons/) — shared utilities and context values (config, emotes, database, login, profile, premium, message handling, shortcuts, sprite manager)
- [src/types/](src/types/) — TypeScript type definitions
- [src/mocks/](src/mocks/) — `MockService` for running without a backend in development

## State management

React Context only — no Redux/Zustand. Five contexts in [src/ApplicationContext.tsx](src/ApplicationContext.tsx):

- `LoginContext` — Twitch auth (access token, user, moderated channels via Twurple)
- `ConfigContext` — user settings (channels, chat config, alert settings, visibility toggles)
- `ProfileContext` — backend-synced user profile (guid-keyed)
- `ChatEmotesContext` — Twitch / 7TV emote metadata
- `PremiumContext` — premium feature flags

Profile state syncs to backend via `storeProfile()` / `loadProfileFromServer()` / `deleteProfileFromServer()`. Set `VITE_BYPASS_LOGIN=true` to skip login in dev.

## External integrations

- **Twitch** via Twurple (`@twurple/api`, `@twurple/auth`) using `StaticAuthProvider` with OAuth tokens
- **OBS** via `obs-websocket-js` — `switcher.ts` keeps scene/stream state in sync with the backend over WebSocket
- **Backend API** at `VITE_BACKEND_URL` — profile, analytics, news, premium, bot, channels
- **7TV API** — cosmetics/emotes (see `spritemanager.ts`)
- **IndexedDB** — client-side cache (`userEmotes`, `alertConfigs`, `seventvCosmetics` stores)

`pg-format` is in `dependencies` but unused in `src/`. Don't add database code on the client.

## Conventions

- Reactive message flow uses **PubSub.js** with a `MessageHandler` callback pattern — don't bypass it for ad-hoc event wiring
- Reconnect/retry logic uses exponential backoff — follow the existing pattern when adding new WebSocket clients
- Service worker registered from [index.html](index.html) for PWA support
- Component folders are organized by feature, not by atomic-design layer

## Commands

- `yarn dev` — Vite dev server
- `yarn build` — `tsc && vite build`
- `yarn typecheck` — `tsc --noEmit`
- `yarn lint` — eslint + stylelint
- `yarn prettier` / `yarn prettier:write`
- `yarn vitest` (one-shot) / `yarn vitest:watch`
- `yarn test` — full gate: typecheck → prettier → lint → vitest → build

Run `yarn test` before opening a PR. There are currently no test files in `src/`, but the gate still runs.
