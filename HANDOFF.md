# Petati — Handoff

> Read this first when starting a fresh chat. Companion: the approved plan at
> `C:\Users\MnS\.claude\plans\this-would-be-an-zany-ocean.md` (architecture + step list).

## Working style
- **Collaborate**: propose with a recommendation before locking user-facing decisions.
- **Plan mode** for direction-setting work; the owner approves before build.
- **Make partial scope OBVIOUS**: anything shipped deliberately small goes in the scope ledger below
  AND carries a `// SCOPE(<phase>): … GROWS LATER → …` code tag.
- **Git**: push to `main` freely. Author is Parsa (global git config). **Never add an AI co-author
  line.** No `Co-Authored-By`, no "Generated with" footer.
- **Multi-store is unpaid and hidden.** Never surface it to the client. Gate every trace behind
  `FEATURE_MULTI_STORE` + Owner role.
- Keep this file and the plan in lockstep; absolute dates only.

## What this is
E-commerce site for a client (first store: pet accessories, physical goods with variants). Under the
hood it is a **multi-store platform**: an Owner can create a whole new branded store (logo, colours,
one of four design variants per storefront section) on its own subdomain or custom domain, all from
one codebase and one database. Languages: English, Turkish, Farsi (RTL) for storefront **and** admin.
Payments: none yet; iyzico (Turkey) later. Thorough admin: orders, inventory, finance, roles.

## Stack & environment
- Next.js 16.3.4 (App Router, `cacheComponents: true`, Turbopack, `src/` dir), React 19, TypeScript.
- Tailwind v4 + shadcn/ui (`base-nova` style, `rtl: true` in `components.json`).
- next-intl 4 with `messages/{en,tr,fa}.json`, `[locale]` prefix always.
- Supabase (Postgres, Auth, Storage) via `@supabase/ssr`. Local stack through Supabase CLI (npm devDependency) which **needs Docker Desktop — not installed on the dev machine as of 2026-09-07**.
- Resend + react-email for transactional mail (optional in dev, logs to console without a key).
- Vercel for hosting. Vercel CLI not installed yet.
- Dev OS: Windows 11, Node 22.14, npm 11.
- No secrets in this file. Env template: `.env.example`.

## Conventions
- Every tenant table has `store_id` + RLS. Never query tenant data without a store scope.
- Money is stored as integer minor units with the store's currency; format at the edge.
- Storefront sections live in `src/components/storefront/<section>/{minimal,bold,editorial,playful}.tsx`
  with a shared `types.ts` props contract. The registry in `src/lib/theme/registry.ts` picks the
  variant from the store's `theme` JSON. Use Tailwind logical properties (`ps-`, `ms-`, `start-`) so RTL works.
- Permission matrix lives only in `src/lib/auth/permissions.ts`. Server actions check it before using
  the service-role client.
- Payment providers implement `src/lib/payments/provider.ts`. `manual` is live; `iyzico` is a stub.
- Next.js 16 differs from older training data: read `node_modules/next/dist/docs/` before using an
  API you are unsure about (see `AGENTS.md`). Middleware is `src/proxy.ts`.

## Current status (2026-09-07)
Done:
- Repo scaffolded, deps installed, shadcn initialised with base components, i18n config + message
  files for three languages, `.env.example`, Supabase CLI initialised (`supabase/config.toml`).
In progress:
- Step 2: database migrations, RLS, seed (unverified until Docker is installed).
Not started: tenant proxy, auth, storefront, admin, themes B–D, deploy config.

## File map (key files)
- `next.config.ts` — cacheComponents on, next-intl plugin, image hosts.
- `src/i18n/{config,routing,navigation,request}.ts` — locales, RTL helper, next-intl wiring.
- `messages/{en,tr,fa}.json` — all UI strings, namespaced (`common`, `nav`, `product`, `cart`, `checkout`, `account`, `auth`, `orderStatus`, `footer`, `admin`).
- `components.json` — shadcn config.
- `.env.example` — every env var with comments.
- `supabase/` — CLI config, migrations, seed, pgTAP tests.

## Roadmap / next steps
1. ~~Repo + tooling + handoff~~ (done 2026-09-07)
2. **← ACTIVE** Database schema, RLS, seed, generated types
3. Tenant proxy, i18n layouts, Supabase auth, permission matrix, admin route guard
4. Storefront theme A end to end (catalog, cart, checkout with manual payment, account, reviews, wishlist, emails)
5. Admin panel (all modules; store creation hidden behind flag)
6. Themes B, C, D
7. Deploy readiness (vercel.ts, wildcard domain, `supabase link`/`db push` to client project)

## Deliberately partial — grows later (scope ledger)
| Area | What shipped now | Intended full shape | Grows in |
|---|---|---|---|
| Multi-store | Built, hidden behind `FEATURE_MULTI_STORE` + Owner | Visible "Create store" wizard, domains UI | When client pays |
| Payments | `manual` provider (order = pending_payment, admin marks paid) | iyzico checkout + webhooks + refunds | When client supplies iyzico credentials |
| Local DB | Migrations written | Verified with `supabase start` | When Docker Desktop is installed |
| Themes | Theme A only (step 4) | Four variants per section | Step 6 |

## Gotchas / open issues
- `cacheComponents: true` means any page reading cookies/headers/params must sit under a Suspense
  boundary or use `"use cache"` correctly. Expect build errors if you forget.
- next-intl `localePrefix: "always"`; the bare root is redirected by proxy to the store's default locale.
- shadcn `form` component was not added (needs react-hook-form); add it when building admin forms.
- Docker Desktop missing → `npx supabase start` will fail until installed.
- Owner has not yet provided the client's Supabase project; local only for now.

## Running it
```
npm install
# once Docker Desktop is installed:
npx supabase start
npx supabase db reset            # applies migrations + seed.sql
npx supabase status              # copy URL / anon / service_role into .env.local
cp .env.example .env.local
npm run dev                      # http://localhost:3000
npm run lint && npx tsc --noEmit && npm run build
```
