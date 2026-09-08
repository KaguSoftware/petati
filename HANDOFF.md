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
- Supabase (Postgres, Auth, Storage) via `@supabase/ssr`. **The app runs against the linked cloud project `zsuxkiqswaaxgpibwstb`** (eu-central-1, the client's account) since 2026-09-08; `.env.local` holds its URL + legacy anon/service_role JWTs (`npx supabase projects api-keys --project-ref zsuxkiqswaaxgpibwstb -o json`). The local Docker stack (machine 2 only) is used for `db reset` + pgTAP. Migrations reach the cloud with `npx supabase db push` (CLI already linked + authenticated).
- Resend + react-email for transactional mail (optional in dev, logs to console without a key).
- Vercel hosting at https://petati.vercel.app (auto-deploys from `main`). The Vercel CLI is not logged in on any dev machine, so env vars are set in the Vercel dashboard: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ROOT_DOMAIN=petati.vercel.app`, `DEFAULT_STORE_SLUG=default`, `FEATURE_MULTI_STORE=false`, `NEXT_PUBLIC_APP_URL=https://petati.vercel.app`, `EMAIL_FROM_FALLBACK`, optional `RESEND_API_KEY`.
- Dev OS: Windows 11. Machine 1: Node 22.14, npm 11 (no Docker). Machine 2: Node 24.15, npm 12, Docker Desktop 29 (works).
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

## Current status (2026-09-08, evening)
Done (build, typecheck, lint, 25 pgTAP tests green; every flow below verified with Playwright against the cloud project):
- Steps 1–4 as before (repo, schema, tenant proxy/auth, storefront theme A).
- **UI foundation**: every control is custom (Base UI shadcn Select/Checkbox/RadioGroup/Combobox/NumberField…; no native select/checkbox/radio/number/date/color anywhere); OverlayScrollbars on the document and scroll containers (no layout shift, RTL-mirrored); `DirectionProvider` mounted; Latin-only inputs (`LatinInput`) stay LTR under `fa`; navbar redesign with logo slot, pill nav (3 categories, 5 at xl, rest via Shop/drawer) and an animated hamburger drawer.
- **Phone onboarding**: `profiles.phone` (E.164, unique) + `phone_country`; `PhoneField` (country Combobox + LTR number, `libphonenumber-js` server-side); required at sign-up and enforced by a one-time `/complete-profile` screen (account, checkout, admin, sign-in, OAuth callback).
- **Step 5 admin — all modules built**: dashboard, orders (lifecycle + emails + refunds), products (translations, options/variants, images, categories), inventory (adjustments = stock movements, log), customers (`v_customer_stats`), coupons, reviews, finance (overview, margins, expenses), design (theme editor + live preview + branding upload), settings (general/commerce/pages/shipping), staff (invite/role/remove). Shell: Suspense frame (`instant = false`), mobile Sheet nav, DropdownMenu user menu, breadcrumbs, shared `StatusTabs`/DataTable/toolbar/dialog components under `src/components/admin/shared/`.
- **Multi-store (hidden)**: `/admin/stores` list + 7-step create wizard + domain actions, gated by `FEATURE_MULTI_STORE` AND platform owner (`requireMultiStore`). On locally (`.env.local`) so `testuser@gmail.com` (platform owner on the cloud project, password `12345678`) can use it; keep it off in Vercel.
In progress: nothing. Not started: themes B–D, iyzico, rich text editor, CSV export, DNS verification.

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
- `src/lib/admin/{context,guard,validate,list-params,constants,types}.ts` — admin plumbing: `requireAdminPage`, `adminMutation`, form parsing (`uuidField` is lenient on purpose), list params.
- `src/lib/admin/<module>/{queries,actions}.ts` + `src/components/admin/<module>/` + `src/app/[locale]/admin/<module>/` — one folder per module (orders is the reference).
- `src/lib/admin/stores/*` — hidden multi-store: `guard.ts` (`requireMultiStore`), schema, actions, domain actions; wizard under `src/components/admin/stores/`.
- `src/components/forms/{latin-input,country-select,phone-field}.tsx`, `src/lib/phone/{countries,normalize}.ts` — LTR inputs, country picker, phone validation.
- `src/components/scroll/document-scrollbars.tsx`, `src/components/ui/overlay-scroll.tsx` — overlay scrollbars.
- `supabase/` — CLI config, migrations, `seeds/01_store.sql` (env-agnostic; was pushed to the cloud) + `seeds/02_dev_users.sql` (LOCAL ONLY demo users), pgTAP tests (`rls`, `rls_enabled`, `customer_stats`, `stores_policy`).

## Roadmap / next steps
1. ~~Repo + tooling + handoff~~ (done 2026-09-07)
2. ~~Database schema, RLS, seed~~ (written 2026-09-07, verified live 2026-09-08)
3. ~~Tenant proxy, i18n layouts, Supabase auth, permission matrix, admin route guard~~ (done 2026-09-07)
4. ~~Storefront theme A end to end~~ (done 2026-09-07, verified against the local DB 2026-09-08)
5. ~~Admin panel (all modules; store creation hidden behind flag)~~ (done 2026-09-08)
6. **← NEXT** Themes B, C, D (section variants `bold`/`editorial`/`playful`; the design editor and wizard already list them as "coming soon")
7. Deploy readiness: Vercel env vars (see Stack), wildcard domain for subdomains, Resend key, Google OAuth credentials in the Supabase dashboard, SMTP for staff invites
8. Client logo + brand colours (Design page), iyzico when credentials arrive

## Deliberately partial — grows later (scope ledger)
| Area | What shipped now | Intended full shape | Grows in |
|---|---|---|---|
| Multi-store | Built, hidden behind `FEATURE_MULTI_STORE` + Owner | Visible "Create store" wizard, domains UI | When client pays |
| Payments | `manual` provider (order = pending_payment, admin marks paid) | iyzico checkout + webhooks + refunds | When client supplies iyzico credentials |
| Themes | `minimal` only; registry falls back to it for any other variant | Four variants per section | Step 6 |
| Content pages | privacy/terms/about read plain text from `store.settings.pages` | Rich text editor in admin | Step 5 |
| Admin | All modules live | Rich text for pages/descriptions, CSV export, SQL aggregates for counts | As needed |
| Phone | Unique E.164 per account; emoji flags (letter pairs on Windows) | SVG flags; OTP login | Later |
| Staff invites | Supabase built-in SMTP only mails project members → falls back to creating the user silently | Real SMTP/Resend for invites | Deploy readiness |
| Design fonts | Saved in theme JSON, storefront still picks font by locale | Load theme fonts | Themes B–D |
| Store domains | Rows created, `verified_at` never set | DNS verification job | When multi-store is paid |

## Gotchas / open issues
- Machine 1 has no Docker Desktop / WSL (needs an elevated shell: `wsl --install`, reboot,
  `winget install Docker.DockerDesktop`). There `/en` shows the dev error screen
  (ECONNREFUSED 127.0.0.1:54321); use `/en/preview/minimal` for UI work.
- **Port clash**: another project's Supabase stack ("touchpadel") auto-starts with Docker Desktop on
  machine 2 and holds 54321-54324. Run `npx supabase stop --project-id touchpadel` before `npx supabase start`.
- **Seeded auth users must set the token columns to `''`** (`confirmation_token`, `recovery_token`,
  `email_change*`, `phone_change*`, `reauthentication_token`). GoTrue cannot scan NULL there and every
  sign-in fails with "Database error querying schema". `seed.sql` does this; copy the pattern when
  inserting users by hand.
- shadcn here is the Base UI build: `Button` has no `asChild`. Use `buttonVariants()` on a `Link`.
- The React Compiler lint rule forbids creating components during render: never
  `const X = getSection(...)`; use `renderSection(key, variant, props)` from `src/lib/theme/registry.tsx`.
- Files with `"use server"` may only export async functions (helpers go in sibling modules).
- Git Bash mangles leading-slash CLI args into Windows paths; prefix with `MSYS_NO_PATHCONV=1`.
- `cacheComponents: true` means any page reading cookies/headers/params/searchParams must sit under a
  Suspense boundary or use `"use cache"` correctly. The `[locale]` layout wraps children in Suspense;
  pages read `searchParams` in a child component inside `<Suspense>` (see sign-in, category).
  `new Date()` in a server component is also flagged; wrap it in a `"use cache"` helper
  (see `copyrightYear` in `store-chrome.tsx`).
- Do **not** use next-intl's server `NextIntlClientProvider`: it awaits request config and makes the
  root layout dynamic. `src/components/intl-provider.tsx` wraps use-intl's pure provider instead.
  Server components use `getTranslations` from `next-intl/server`; client components use `useTranslations`.
- Zod 4: `.default({})` on objects needs the full output type. Parse partial then merge with a defaults object (see `parseTheme`).
- next-intl `localePrefix: "always"`; the bare root is redirected by proxy to the store's default locale.
- Path-mode URLs `/en/s/<slug>/…` pass through the proxy but storefront links do not preserve the prefix. Preview other stores with `<slug>.localhost:3000` instead.
- shadcn `form` component was not added (needs react-hook-form); add it when building admin forms.
- Cloud project is live (see Stack). Never push `seeds/02_dev_users.sql` to it; to seed only the store file, temporarily set `[db.seed] sql_paths` to `["./seeds/01_store.sql"]` and run `npx supabase db push --include-seed`, then restore.
- `getStoreBySlug` caches misses for seconds now (`MISS_LIFE`), but the dev cache lives in `.next/dev`: if the storefront shows stale data after direct DB edits, restart `next dev`.
- Zod 4: `z.uuid()` rejects our fixture ids (version nibble 0) — use `uuidField` from `src/lib/admin/validate.ts`; `z.record(z.enum(locales), …)` is exhaustive — use `z.partialRecord`.
- next-intl: message strings containing `<…>` must be ICU-quoted (`'<'…'>'`).
- React 19 resets uncontrolled inputs after a form action; key forms/cards on their saved data or control them.
- `useActionState` actions triggered outside a form must run inside `startTransition`.
- Base UI Dialog/Select trigger = `render={<Button/>}`; a Close rendering a `<Link>` needs `nativeButton={false}`.
- OverlayScrollbars body mode skips direction detection: `globals.css` mirrors the document bar under `[dir=rtl]`; hidden Base UI inputs get `margin-left:0` under RTL to avoid a 1px scroll.
- Two `color-field` components exist (`components/admin/color-field.tsx` used by the wizard, `components/admin/design/color-field.tsx` used by the design editor) — consolidate when touching either.
- QA scripts live in `node_modules/.qa/*.mjs` (untracked): sign in as testuser, exercise each module with Playwright (Edge channel).

## Running it
```
npm install
npx supabase start               # Docker Desktop must be running; see port-clash gotcha
npx supabase db reset            # applies migrations + seed.sql
npx supabase status              # local keys (only if you want to run against Docker instead of the cloud)
cp .env.example .env.local        # then paste the cloud keys (see Stack) or the local ones
npm run dev                      # http://localhost:3000
npm run lint && npx tsc --noEmit && npm run build
npx supabase test db             # pgTAP: RLS on every table + role matrix
```
Accounts: on the **cloud** project only `testuser@gmail.com` / `12345678` (platform owner, phone set). Locally (Docker) the demo users from `seeds/02_dev_users.sql` (password `password123`): owner@petati.local, manager@petati.local, staff@petati.local, customer@petati.local — all with seeded phones.
