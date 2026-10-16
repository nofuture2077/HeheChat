# Settings delegates: let trusted people configure HeheChat for a user

## Context
Users want a trusted person (mod, friend, tech helper) to change their HeheChat settings without sharing a Twitch login. Today only the alert editor has token-based access (`user_alert_editor`). Settings are spread across `user_profiles` (config JSON) and per-integration tables (`user_streamelements_data`, `user_elevenlabs`, `user_kofi_data`, …). Decisions taken: **separate delegate token** (alert-editor links stay low-privilege) and a **settings-only UI** for the delegate (no chat, no websocket, no Twitch login).

Key fact: on the backend, every settings route resolves the caller with `findUserId(state)` from `HeheServer/src/commons/twitchauth.js:320`. The frontend sends `localStorage['hehe-token_state']` as `?state=` / `?token=`. So if a delegate token resolves to the owner's userId on the **settings routes only**, every settings table works without per-route changes. It must be an allow-list, because chat send/delete/mod actions (`commons/actions.js`), the websocket (`websocket.js:161`), admin (`admin-api.js`) and premium payments also use `findUserId`.

Two branches: `feature/settings-delegates` off `release` in **both** HeheServer and HeheChat. Bump `package.json` version in both.

## Backend (HeheServer)

1. **Migration**: new `liquibase/settings-delegate-changeset.yml`, included at the end of `changelog.yml`. Table `user_settings_delegate`, same columns as `user_alert_editor`: `id serial pk, name TEXT, created BIGINT, userid VARCHAR(255), channelname TEXT, token TEXT unique`.

2. **Storage** in `commons/channelstorage.js`, next to the editor functions (:175-205). Copy them for the new table: `getSettingsDelegates(userId)`, `findSettingsDelegate(token)`, `createSettingsDelegate(...)`, `deleteSettingsDelegate(userId, token)`.

3. **Resolver** in `commons/twitchauth.js`: add and export
   ```js
   // ponytail: delegate lookups are not cached so a revoke takes effect immediately; cache if it shows up in DB load
   async function findSettingsUserId(state) {
     return (await findUserId(state)) || (await findSettingsDelegate(state))?.userid;
   }
   ```
   `findUserId` itself stays strict (owner only).

4. **Allow-list.** In each settings module, swap the import to `import { findSettingsUserId as findUserId } ...`, a one-line change per file:
   - `modules/user/profiles.js` (profile + profile list = all config)
   - `modules/donation/{streamelements,kofi,pallygg}.js`, `modules/soundalerts/soundalerts.js`, `modules/blerp/blerp.js`, `modules/moblin/moblin.js`, `modules/youtube/youtube-api.js`, `modules/tts/{elevenlabs,shares}.js`, `modules/spotify/spotify.js`
   - `modules/stream-switcher/switcher-api.js` and `modules/bot-accounts/bot-accounts-api.js` (their `authChannel` uses `findUserId`)
   - `modules/event/event.js`, so delegates can open and create alert-editor links (editor access is lower privilege than delegate access)
   - Check each file for non-settings routes. If a file mixes in something sensitive, call strict `findUserId` there under its real name.
   - **Not switched:** admin, premium, websocket, actions, twitch, analytics/stats, push, logo, gpx.

5. **Management routes**, strict owner-only so a delegate can't mint more delegates. Put them in `modules/user/profiles.js` and mirror `/alert/editor` (`event.js:447-476`): `GET /settings/delegate?state`, `PUT /settings/delegate?state&name` (uses `generateGUID()` from `commons/helper.js`), `DELETE /settings/delegate?state&token`. Add one more, `GET /settings/delegate/whoami?token`, which returns `{ channelname }` for a valid delegate token and 401 otherwise. The delegate UI uses it to validate the link and show "Managing settings for X".

## Frontend (HeheChat): separate `manage.html` app

The delegate gets its own entry point, like `alert.html`, so chat, the websocket worker, Twitch login and AlertSystem never boot for a delegate, and nothing delegate-specific leaks into the main app. The one thing both apps need is the profile/config state behind `ConfigContext` and `ProfileContext`: profile state, about 200 config setters, profile load/save, and the `appConfig`/`appProfile` objects in `src/HeheChatApp.tsx:101-150, 171, 230-320, 537-900, 900-1043, 1243`. The Settings components call those setters directly, so this state gets **extracted, not duplicated**.

1. **Extract `src/hooks/useProfileConfig.ts`** (a pure move, no logic change):
   - Move in `storeProfile`, `loadProfileFromServer`, `deleteProfileFromServer`, `loadProfiles(FromServer)`, `saveProfiles`, the `profile`/`profiles` state, the load and debounced-save effects, `updateConfig`/`patchConfig` and all setters, profile switch/create/delete, shares, and the `appConfig` and `appProfile` objects.
   - Return `{ profile, setProfile, appConfig, appProfile }`.
   - Leave in HeheChatApp anything that needs login, the worker or PubSub (the `WS-profile` subscription, `loadReceivedShares` on connect, and so on). HeheChatApp calls the hook and keeps working exactly as before.
   - Check: `yarn typecheck` passes, and the main app loads and saves its profile the same as before.

2. **New entry `manage.html` → `src/manage.tsx` → `src/ManageApp.tsx`**, plus `manage: './manage.html'` in `vite.config.ts` inputs.
   - Link format: `${origin}/manage.html#token=<delegate>`. Keep the token in the hash (like `alert.html`) so reload works and the token is never sent to a server in a URL.
   - `src/manage.tsx`, before rendering: read `token` from the hash, then shadow `localStorage.getItem('hehe-token_state')` to return it. The ~50 direct reads in settings components and `src/api/*` then use the delegate token, the shadow exists only in this bundle, and the delegate's own HeheChat login is untouched. Mark it with a `ponytail:` comment (ceiling: switch to a `backendState()` helper if more storage keys need overriding).
   - `ManageApp`:
     - Calls `/settings/delegate/whoami?token`. On 401 it shows "Link invalid or revoked".
     - Otherwise it renders `MantineProvider`, `ConfigContext`/`ProfileContext` from `useProfileConfig()`, a stub `LoginContext` (`isLoggedIn: () => true`, no API client) and `PremiumContext` from `/premium/status` if settings read it, plus a header "Managing settings for <channel>" and `<Settings>` full page instead of in the drawer.
     - Copy the provider setup from `HeheChatApp.tsx:1299-1316` and keep only what Settings needs.

3. **Hide tabs** that need the owner's Twitch client, account or the chat runtime: give `Settings` a `hiddenTabs?: SettingsTab[]` prop that filters `NAV_GROUPS`. ManageApp passes `GeneralAccountSettings`, `AlertsRerollSettings`, Premium, Delegates, plus anything else that throws without a Twurple client. Find these while testing; the starting point is the components that read `LoginContext`: `general/GeneralUISettings.tsx`, `general/GeneralAccountSettings.tsx`, `alerts/AlertsRerollSettings.tsx`.

4. **Owner UI**: new tab "General › Delegates" in `src/components/settings/settings.tsx` (`SettingsTab` union + `NAV_GROUPS` + `renderContentBody`). Component `general/GeneralDelegateSettings.tsx` is a trimmed copy of `alerts/AlertsEditorSettings.tsx` (list / create / delete / copy link) against `/settings/delegate`.

## Out of scope (say so in the PR)
Expiry and per-tab permissions on delegate tokens, an audit log of delegate changes, delegates using chat/mod tools.

## Verification
- Backend: run the migration. Then, with a delegate token, check that `GET /profile/list?token=<delegate>` and `/streamelements/get?state=<delegate>` return the owner's data; that `/settings/delegate?state=<delegate>`, `/api/admin/*` and a websocket registration with the delegate token are rejected; and that after DELETE the token stops working immediately.
- Frontend: after step 1 alone, the main app behaves identically (profile switch, a setting persists across reload). Then `yarn dev`: as the owner, create a delegate link and open `manage.html#token=…` in another browser. Check that a config change (e.g. a chat setting) and a connect setting (e.g. ElevenLabs key) persist and show up in the owner's app after reload, and that no websocket connection opens (Network tab). Revoke the link and check that a reload shows "invalid". Check that a delegate who is also logged in to HeheChat keeps their own session in other tabs.
- `yarn prettier:write && yarn lint && yarn test` in HeheChat; the server's lint/tests in HeheServer.
