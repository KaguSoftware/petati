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
- **Security is layered, never optional** (owner's standing rule, 2026-09-07):
  1. Row Level Security is enabled on **every** table in `public` (guarded by `supabase/tests/rls_enabled.test.sql`, which fails the test suite if a table lacks it). Every new migration must `enable row level security` and add policies.
  2. The service-role client (`src/lib/supabase/admin.ts`) bypasses RLS, so it is only called after `requirePermission()` from `src/lib/auth/session.ts`, or for public catalog/tenant reads that are scoped by `store_id` in the query.
  3. The permission matrix in `src/lib/auth/permissions.ts` mirrors the SQL helpers (`is_owner`, `has_store_access`). Both sides must agree.
  4. All server actions validate input with zod; redirects only accept same-site relative paths; password-reset never reveals whether an email exists.
  5. Storage bucket paths start with `<store_id>/` and policies check membership on that prefix.
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
Done (build + typecheck + lint pass; nothing exercised against a live DB yet):
- Step 1: repo, deps, shadcn (RTL on), next-intl with `messages/{en,tr,fa}.json`, `.env.example`.
- Step 2: four migrations (platform, catalog, commerce, finance) with RLS on every table, SQL
  helpers, stock-movement + rating triggers, finance views, seed (4 demo users, 1 store, 5
  categories, 20 products with variants, coupons, shipping rates), pgTAP tests. SQL is
  syntax-checked with a PG17 parser only; **not yet run** (no Docker).
- Step 3: `src/proxy.ts` (tenant + locale + session refresh + admin guard), cached store lookup,
  theme JSON parsing → CSS vars, permission matrix, session helpers, auth pages
  (sign-in / sign-up / forgot-password, Google OAuth, callback route), admin shell with
  role-filtered nav and flag-gated store switcher, locale switcher, storefront placeholder page.
- Step 4: storefront theme A ("minimal") end to end: cached catalog queries, cart (cookie token,
  server actions), coupons, checkout with live totals and the `manual` payment provider, order
  creation (customer upsert, items snapshot, stock movements, coupon redemption, confirmation email),
  order page, account area (orders, addresses, wishlist, profile/password), reviews (pending →
  moderated), newsletter opt-in, content pages. Twelve section variants under
  `src/components/storefront/sections/*/minimal.tsx` behind the registry.
- Dev QA harness: `/{locale}/preview/{variant}` renders every section with fixture data and no
  database (`src/lib/theme/fixtures.ts`). Screenshot-checked at 390px and 1280px in EN and FA with
  Playwright (Edge channel): no horizontal overflow, RTL mirrors correctly, Vazirmatn renders.
- Friendly dev error screen (`src/app/[locale]/error.tsx`) explains when Supabase is unreachable.
**Not verified against a live database**: nothing has run against Postgres yet (see Gotchas).
In progress:
- Step 5: admin panel modules.
Not started: themes B–D, deploy config.

## File map (key files)
- `next.config.ts` — cacheComponents on, next-intl plugin, image hosts.
- `src/proxy.ts` — tenant resolution (custom domain → subdomain → default), locale redirect, session refresh, `/admin` guard, rewrite to `/[locale]/s/[store]/…`.
- `src/lib/tenant/{resolve,store,proxy-lookup}.ts` — pure host parsing, `"use cache"` store lookup (tag `store:<slug>`), proxy-side TTL cache.
- `src/lib/theme/types.ts` — section keys, variant keys, theme JSON parser, CSS var mapping.
- `src/lib/auth/{permissions,session,actions}.ts` — matrix, `requirePermission`, auth server actions.
- `src/lib/supabase/{server,client,admin}.ts` — cookie client, browser client, service-role client.
- `src/lib/db/types.ts` — hand-written row types (replace with generated types once Docker works).
- `src/lib/{money,i18n,env}.ts` — minor-unit formatting, translated-JSON picker, env + feature flags.
- `src/app/[locale]/layout.tsx` — root html (lang/dir/fonts), client intl provider, Suspense boundary.
- `src/app/[locale]/s/[store]/` — storefront (layout injects theme CSS vars; auth pages live here so they are themed).
- `src/app/[locale]/admin/` — admin (layout resolves active store + role; `components/admin/admin-shell.tsx`).
- `src/app/[locale]/preview/[variant]/page.tsx` — dev-only section harness with fixture data.
- `src/lib/catalog/{queries,types}.ts` — cached public catalog reads (tag `catalog:<storeId>`), view models.
- `src/lib/cart/{cart,actions,coupon}.ts` — cart cookie/token, server actions, coupon validity.
- `src/lib/checkout/{totals,actions}.ts` — single source of order maths; `placeOrderAction`.
- `src/lib/payments/{provider,manual,iyzico,index}.ts` — gateway contract; manual live, iyzico stub.
- `src/lib/account/{queries,actions}.ts` — orders/addresses/wishlist/reviews/profile for shoppers.
- `src/lib/email/send.ts`, `src/emails/order-confirmation.tsx` — Resend or console fallback.
- `src/components/storefront/sections/types.ts` — the props contract every variant must honour.
- `src/components/storefront/shared/*` — interactive pieces shared by all variants (add-to-cart, cart controls, forms).
- `src/i18n/{config,routing,navigation,request}.ts` — locales, RTL helper, next-intl wiring.
- `messages/{en,tr,fa}.json` — all UI strings, namespaced.
- `supabase/` — CLI config, migrations, seed, pgTAP tests.

## Roadmap / next steps
1. ~~Repo + tooling + handoff~~ (done 2026-09-07)
2. ~~Database schema, RLS, seed~~ (written 2026-09-07, unverified without Docker)
3. ~~Tenant proxy, i18n layouts, Supabase auth, permission matrix, admin route guard~~ (done 2026-09-07)
4. ~~Storefront theme A end to end~~ (done 2026-09-07, DB-verification pending)
5. **← ACTIVE** Admin panel (all modules; store creation hidden behind flag)
6. Themes B, C, D
7. Deploy readiness (vercel.ts, wildcard domain, `supabase link`/`db push` to client project)

## Deliberately partial — grows later (scope ledger)
| Area | What shipped now | Intended full shape | Grows in |
|---|---|---|---|
| Multi-store | Built, hidden behind `FEATURE_MULTI_STORE` + Owner | Visible "Create store" wizard, domains UI | When client pays |
| Payments | `manual` provider (order = pending_payment, admin marks paid) | iyzico checkout + webhooks + refunds | When client supplies iyzico credentials |
| Local DB | Migrations written | Verified with `supabase start` | When Docker Desktop is installed |
| Themes | `minimal` only; registry falls back to it for any other variant | Four variants per section | Step 6 |
| Content pages | privacy/terms/about read plain text from `store.settings.pages` | Rich text editor in admin | Step 5 |
| Admin | Shell + dashboard placeholder | All modules | Step 5 |

## Gotchas / open issues
- **BLOCKER for end-to-end testing (2026-09-07): Docker Desktop and WSL are not installed and the
  dev shell is not elevated.** Owner must run as administrator: `wsl --install` (reboot), then
  `winget install Docker.DockerDesktop`, open Docker Desktop once, then `npx supabase start`,
  `npx supabase db reset`, `npx supabase status` → keys into `.env.local`. Until then `/en` shows the
  dev error screen (ECONNREFUSED 127.0.0.1:54321); use `/en/preview/minimal` for UI work.
- shadcn here is the Base UI build: `Button` has no `asChild`. Use `buttonVariants()` on a `Link`.
- The React Compiler lint rule forbids creating components during render: never
  `const X = getSection(...)`; use `renderSection(key, variant, props)` from `src/lib/theme/registry.tsx`.
- Files with `"use server"` may only export async functions (helpers go in sibling modules).
- Git Bash mangles leading-slash CLI args into Windows paths; prefix with `MSYS_NO_PATHCONV=1`.
- `cacheComponents: true` means any page reading cookies/headers/params must sit under a Suspense
  boundary or use `"use cache"` correctly. The `[locale]` layout wraps children in Suspense.
- Do **not** use next-intl's server `NextIntlClientProvider`: it awaits request config and makes the
  root layout dynamic. `src/components/intl-provider.tsx` wraps use-intl's pure provider instead.
  Server components use `getTranslations` from `next-intl/server`; client components use `useTranslations`.
- Zod 4: `.default({})` on objects needs the full output type. Parse partial then merge with a defaults object (see `parseTheme`).
- next-intl `localePrefix: "always"`; the bare root is redirected by proxy to the store's default locale.
- Path-mode URLs `/en/s/<slug>/…` pass through the proxy but storefront links do not preserve the prefix. Preview other stores with `<slug>.localhost:3000` instead.
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
