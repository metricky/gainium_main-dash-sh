# Gainium dashboard — self-hosted

Self-hosted React + TypeScript dashboard for Gainium trading bots.
Runs against a local [app-sh](https://github.com/Gainium/main-app-sh)
backend (Mongo + Redis + Rabbit + the exchange connector).

Optional UI surfaces (subscription, affiliate, rewards, help center,
telemetry, OAuth login, in-app chat, …) are toggled via build-time
feature flags (`src/config/features.ts`).

Premium features (hedge bots, global variables, Hyperliquid exchange)
are gated by a license key. Generate one at
[gainium.io](https://app.gainium.io/subscription) and paste it into
Settings → License after first install.

---

## Quickstart

```bash
git clone https://github.com/Gainium/main-dash-sh.git
cd main-dash-sh

cp .env.example .env
# edit .env to point VITE_API_ENDPOINT at your local app-sh backend

npm install
npm run dev
```

By default the dev server starts on Vite's port (usually 5173). Open
`http://localhost:5173`.

First run on a fresh `app-sh` install:
1. The dashboard detects no users exist (`checkUserExist` returns
   false) and shows the register form.
2. Enter email, password, name, timezone, and your license key.
3. Backend validates the key, creates the user, returns an auth
   token. You're in.

Subsequent runs: regular email/password login.

## Backend prerequisites

`app-sh` must expose these GraphQL operations (current `app-sh`
already does — see its `src/graphql/schema.ts`):

- `checkUserExist` query
- `registerAccount(input: registerAccountInput!)` mutation
- `token(input: tokenInput!)` mutation (login)
- `deleteToken` mutation (logout)
- `setLicenseKey(input: setLicenseKeyInput!)` mutation
- `deleteLicenseKey` mutation
- `user { licenseKey { key, isPremium } … }` on the user response

Plus the regular bot / exchange / deal / order surface used by all
Gainium clients.

## Architecture

The codebase uses three adapter contracts so the host app can plug in
platform-specific behavior without forking files:

- **`src/lib/analytics`** — `track`/`identify`/`reset`/`pageview`
  dispatcher. Register an analytics provider at boot, or leave it
  unregistered so every call becomes a no-op.
- **`src/lib/auth`** — `AuthEnvWrapper` for the React-tree
  context + `useAuthCapabilities()` for the Login page to know
  whether to render the Google button or the first-install register
  branch.
- **`src/lib/license`** — `useLicense()` hook returning
  `{ isPremium, hasKey, key? }`. The default implementation reads
  `user.licenseKey.isPremium` from the auth store.

`main.tsx` registers `useShLicense` and a pass-through auth provider.

## Feature flags

Optional routes / nav items / UI fragments are gated by
`src/config/features.ts`. The `.env.example` sets feature flags to
sensible defaults. Adding a new optional surface? Add a flag, set
it in your env, and wrap the route/component in
`<FeatureGate feature="...">`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build (tsc + vite + service worker) |
| `npm run preview` | Preview the production build locally |
| `npm run type-check` | `tsc -b --noEmit` |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run format` / `npm run format:check` | Prettier |
| `npm test` | Playwright e2e |
| `npm run test:unit` | Playwright unit suite |

## Repo layout

```
src/
├── adapters/         bot data transforms
├── components/       feature components (bots, exchanges, charts, …)
├── config/           feature flags + shadcn config
├── constants/        cross-cutting constants
├── context/, contexts/  React contexts (auth, bot form, live updates)
├── features/         bot-types/, registry/, widgets/, etc
├── hooks/            data hooks (useBots, useExchanges, useDeals, …)
├── lib/              adapters (analytics, auth, license), GraphQL,
│                     api client, query client, demo helpers, etc
├── mappers/          form-data ↔ backend payload
├── pages/            page-level components (bots, exchanges, …)
├── services/         exchange + GraphQL services
├── stores/           Zustand stores (auth, live updates, dashboard, …)
├── types/            shared TS types
└── utils/            tradingView datafeed, candles, indicators, …
```
