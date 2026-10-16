# CLAUDE.md

## Workflow rules

- Keep changes minimal — touch only what the task requires.
- Base all work on the `release` branch (not `main`).
- For every change, create a new branch off `release`:
  - `feature/<short-name>` for new features
  - `bugfix/<short-name>` for fixes
- Bump the `version` field in [package.json](package.json) for every change.
- Before every commit, run `yarn prettier:write` and `yarn lint` — commits must pass `yarn prettier` and have 0 lint errors.

## Project overview

HeheChat is a Twitch chat/streaming companion app built with Vite + React 19 + TypeScript + Mantine v9. It integrates with Twitch (via Twurple), OBS (via obs-websocket-js), and a backend API (`VITE_BACKEND_URL`).

Package manager: **yarn 4.3.1**.

## System overview

HeheChat consists of three projects that are developed side by side (sibling folders under `~/Development`):

| Project | Folder | Role |
| --- | --- | --- |
| **HeheChat** (frontend) | `HeheChat/` | Vite + React app: multi-channel Twitch chat for streamers/mods, admin dashboard, OBS browser sources (alerts, chat overlay), alert replay, scene switcher |
| **HeheServer** (backend) | `HeheServer/` | Node.js/Express + `ws` server: Twitch auth, chat/EventSub ingestion, alert pipeline, profiles, premium, analytics, TTS, integrations; PostgreSQL storage |
| **HeheChat-AlertEditor** | `HeheChat-AlertEditor/` | Standalone Vite + React app to design alert configs (media, text, TTS, conditions) and import StreamElements overlays |

How they talk to each other:

- All frontends call the backend over HTTP at `VITE_BACKEND_URL`. The backend allows these origins via CORS (`FRONTEND_ORIGIN`, `BROWSERSOURCE_ORIGIN`, `EDITOR_ORIGIN`, `REPLAY_ORIGIN`, `ADMIN_ORIGIN`, `PROMO_ORIGIN`).
- Live data (chat messages, events, alerts, profile updates, OBS commands) flows from the backend to clients over a single WebSocket server. Inside the backend, modules publish to PubSub.js topics (`WS-<channel>`, `SINK-<token>`, `PROFILE-<id>`, ...) and `HeheServer/src/websocket.js` forwards them to subscribed sockets.
- The chat app opens the alert editor via `VITE_EDITOR_URL?token=<editor token>`. The editor loads and saves the alert config through `/event/config/*` and fetches the sink via `/sink/get`.
- The alert browser source (`alert.html` in HeheChat, URL `VITE_SINK_URL#token=<sink>`) connects to the WebSocket with its sink token and plays the alerts the backend publishes to `SINK-<token>`. The editor embeds it in preview mode (`&preview=true&embed=true`) and triggers test alerts via `/event/replay`.

Changes that touch an HTTP endpoint or a WebSocket message type usually require matching changes in the other project(s) — check both sides.

## Architecture overview (HeheChat)

Each entry point is its own app; they share `src/commons`, `src/components` and `src/api`.

- **Chat app** (`index.html` → `HeheChatApp` → [src/Router.tsx](src/Router.tsx), [src/pages/Chat.page.tsx](src/pages/Chat.page.tsx)) — login, multi-channel chat ([src/components/chat/](src/components/chat/), mod tools in `chat/mod/`), event list and alert controls ([src/components/events/](src/components/events/)), pinned items such as polls, predictions, hype trains, raids ([src/components/pinned/](src/components/pinned/)), Twitch player/stream info ([src/components/twitch/](src/components/twitch/)), settings ([src/components/settings/](src/components/settings/)), premium, profiles, shortcuts, music player, news, stream switcher UI ([src/components/switcher/](src/components/switcher/)).
- **Backend connection** — [src/components/webworker/backendworker.ts](src/components/webworker/backendworker.ts) is a Web Worker that holds the WebSocket to HeheServer (heartbeat watchdog, exponential-backoff reconnect) and relays messages to the page, where they are dispatched through PubSub.js / `MessageHandler` ([src/commons/message.tsx](src/commons/message.tsx)). Used by the chat app, the alert browser source and the replay viewer.
- **HTTP API clients** — [src/api/](src/api/), one file per backend domain, all against `VITE_BACKEND_URL`.
- **Alert browser source** (`alert.html` → `BrowserSourceApp`) — OBS source authenticated by the sink token in the URL hash; plays alerts with [src/components/alerts/alertplayer.tsx](src/components/alerts/alertplayer.tsx) and [src/components/browsersource/](src/components/browsersource/). Also embedded by the alert editor as live preview.
- **Chat browser source** (`chat.html` → `ChatSourceApp`) — chat overlay for OBS.
- **Admin dashboard** (`admin.html` → `AdminApp` / [src/AdminRouter.tsx](src/AdminRouter.tsx), `src/pages/Admin*.page.tsx`) — alerts, analytics, channels, connections, news, premium.
- **Replay** (`replay.html` → `ReplayApp`), **collection** (`collection.html`), **promo** (`promo.html` → `src/pages/promo/`) — smaller standalone pages.
- **Scene switcher** (`switcher.html` → [src/switcher.ts](src/switcher.ts)) — no React; connects to OBS via obs-websocket and to the backend WebSocket as `obs-client`, executing scene commands from the backend's stream-switcher rule engine.
- **Client-side persistence** — IndexedDB ([src/commons/database.ts](src/commons/database.ts)) for emotes, alert configs and 7TV cosmetics; settings and profile in the contexts described below.

## Entry points

The app ships multiple Vite entry points, each producing a standalone bundle:

- [index.html](index.html) → [src/main.tsx](src/main.tsx) — main chat app (`HeheChatApp`)
- [admin.html](admin.html) → [src/admin.tsx](src/admin.tsx) — admin dashboard (alerts, analytics, channels, premium)
- [alert.html](alert.html) → [src/alerts.tsx](src/alerts.tsx) — OBS browser source for alerts (`BrowserSourceApp`)
- [replay.html](replay.html) → [src/replay.tsx](src/replay.tsx) — alert replay viewer
- [collection.html](collection.html) → [src/collection.tsx](src/collection.tsx) — sprite/emote collection viewer
- [switcher.html](switcher.html) → [src/switcher.ts](src/switcher.ts) — OBS scene/stream-state synchronizer
- [chat.html](chat.html) → [src/chat-source.tsx](src/chat-source.tsx) — OBS chat overlay (`ChatSourceApp`)
- [promo.html](promo.html) → [src/promo.tsx](src/promo.tsx) — promo page

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

Run `yarn test` before opening a PR. Vitest picks up `*.test.ts` files next to the code (e.g. `src/commons/message.test.ts`).
