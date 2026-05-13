# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dev dependencies
npm run lint         # ESLint check
npx web-ext lint --self-hosted  # Thunderbird extension lint
npm run build        # verify required files, then package cleanmailbox.xpi
npm audit --audit-level=high    # dependency security check (run in CI)
```

## Procédure de release

1. Mettre à jour `version` dans `manifest.json` et `package.json` (même valeur, ex: `0.13.0`)
2. Renseigner `changelog.md`
3. Commiter ces changements sur `main`
4. Pousser un tag Git — le workflow GitHub Actions prend le relais :
   ```bash
   git tag v0.13.0
   git push origin v0.13.0
   ```
5. Le workflow `.github/workflows/release.yml` :
   - Construit le XPI
   - Met à jour `updates.json` avec le hash SHA-256 du nouveau XPI
   - Crée la release GitHub avec le XPI en pièce jointe
   - Reporte `updates.json` sur `main` (commit `[skip ci]`)

Thunderbird interroge `updates.json` selon sa propre planification (généralement toutes les 24 h).

There are no automated tests. Manual testing requires loading the `.xpi` in Thunderbird 140+.

## Architecture

Thunderbird Manifest V3 extension. Three JavaScript contexts communicate only via `browser.runtime.sendMessage`:

- **`background.js`** — all business logic runs here (service worker). Receives messages from the popup, validates them, calls the CleanMailbox API, and moves the handled message to the Junk folder. No DOM access. Uses XHR instead of `fetch` for the spam report endpoint because Thunderbird throws a `NetworkError` on 4xx/5xx responses with `fetch`.

- **`popup/popup.js`** — UI layer only. Gets the current message ID via `browser.messageDisplay.getDisplayedMessages()`, sends an action request to the background, and shows the result inline via `showStatus()`. Dynamically labels the blacklist buttons with the sender email/domain before the user acts.

- **`options/options.js`** — stores `email`, `apiKey`, and `isConfigured` in `browser.storage.local`. On first install, `background.js` detects `isConfigured === undefined` and opens the options page automatically.

### CleanMailbox API

Base URL: `https://manager.clean-mailbox.com` (only allowed host in `manifest.json`).

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| Report spam | POST | `/public-api/report` | `{ file: "<rfc822-base64>" }` |
| Blacklist address | PUT | `/public-api/domain/{recipientDomain}/bl` | `{ address: "sender@domain" }` |
| Blacklist whole domain | PUT | `/public-api/domain/{recipientDomain}/bl` | `{ address: "*@senderdomain" }` |

Common headers: `Api-Key`, `email`, `Content-Type: application/json`.

When the API returns `ok=false` or `success !== true` for spam reporting, the background returns `errorCode: "detectionNotTransmitted"` (not a hard error — the message is still moved to Junk). The popup displays a specific user-facing reason from the API's `payload.reason` field.

### Message actions flow

All popup actions follow the same path:
1. `popup.js` resolves `messageId` from `browser.messageDisplay.getDisplayedMessages()`
2. Sends `{ action, data: { messageId } }` to `background.js`
3. Background validates sender identity (`sender.id === browser.runtime.id`) and action whitelist (`ALLOWED_ACTIONS`)
4. Calls the appropriate handler, which reads config from `browser.storage.local`, executes the API call, then calls `moveMessageToJunk()`
5. `moveMessageToJunk()` uses `browser.folders.query({ specialUse: ["junk"], isUnified: false, isVirtual: false })` — first scoped to the message's account, then globally as fallback

### getRawMessageBase64

Two-tier fallback for raw message encoding: tries `data_format: "BinaryString"` + `btoa()` first; falls back to `data_format: "File"` + `arrayBuffer()` + chunked `String.fromCharCode` to avoid stack overflow on large messages.

## Localization

French and English. `default_locale` is `fr`. All UI strings go through `lib/i18n.js` (`init()`, `t()`, `applyI18n()`) — `browser.i18n.getMessage()` is not called in `popup.js` or `options.js`. The user-selected locale (`fr` or `en`) is stored in `browser.storage.local` under the key `locale` and read at page load. `_locales/fr/` and `_locales/en/` remain for Thunderbird extension metadata only.

## Security notes (from `.doc/security.md`)

- `email` and `apiKey` are stored unencrypted in `browser.storage.local` — document this to users, don't add encryption without explicit request.
- Error details from the API must stay in `background.js` logs; only generic messages or internal error codes should reach the popup.
- `host_permissions` is intentionally limited to `https://manager.clean-mailbox.com/*`.
- Remaining `npm audit` moderate findings are in the `web-ext → addons-linter → ajv` transitive chain; forced downgrade to `web-ext@6.8.0` is not recommended.
