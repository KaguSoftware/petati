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
- Vercel hosting at https://petati.vercel.app (auto-deploys from `main`). **Functions are pinned to `fra1` in `vercel.json`** (next to the Supabase project; the default was `iad1`, which cost ~120 ms per database call — see Gotchas). The Vercel CLI is not logged in on any dev machine, so env vars are set in the Vercel dashboard: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ROOT_DOMAIN=petati.vercel.app`, `DEFAULT_STORE_SLUG=default`, `FEATURE_MULTI_STORE=false`, `NEXT_PUBLIC_APP_URL=https://petati.vercel.app`, `EMAIL_FROM_FALLBACK`, optional `RESEND_API_KEY`.
- Dev OS: Windows 11. Machine 1: Node 22.14, npm 11 (no Docker). Machine 2: Node 24.15, npm 12, Docker Desktop 29 (works).
- No secrets in this file. Env template: `.env.example`.

## Conventions
- Every tenant table has `store_id` + RLS. Never query tenant data without a store scope.
- Money is stored as integer minor units with the store's currency; format at the edge.
- Storefront sections live in `src/components/storefront/sections/<section>/{minimal,bold,editorial,playful}.tsx`
  with a shared `types.ts` props contract. The registry in `src/lib/theme/registry.tsx` picks the
  variant from the store's `theme` JSON. Use Tailwind logical properties (`ps-`, `ms-`, `start-`) so RTL works.
  The four keys are design languages AND, per section, four structurally different layouts (catalog in
  `admin.design.layouts.*` messages; e.g. navbar = Classic / Stacked / Split / Floating pill).
- **Container queries, not media queries, inside `src/components/storefront/**`** (2026-09-09): sections use
  `@phablet:` `@tablet:` `@desktop:` `@wide:` (= sm/md/lg/xl, defined in `globals.css`), never `md:`. The
  storefront root (`s/[store]/layout.tsx`) and every admin `PreviewFrame` declare `@container`, which is what
  lets the Design picker draw a desktop layout inside a small zoomed box. Sections/shared components must not
  declare their own `@container`, and must not use `vh`/`vw`/`*-screen`. Horizontal scroll rows with
  fixed-width items need `contain-inline-size` or they inflate the page width. Gate:
  `grep -rnP '(?<![w@-[:])(sm|md|lg|xl|2xl):' src/components/storefront` must return nothing.
- **Storefront layout rules (2026-09-09 visual QA pass)**: the storefront root is a flex column, so every page/section root
  must stretch (`*:w-full` on the root; never rely on `mx-auto` alone). Horizontal insets come from the `px-gutter`
  utility (1rem → 1.5rem @tablet → 2rem @desktop), never `px-4` on a container. Controls are shop-sized inside
  `[data-storefront]` (inputs/selects 2.75rem, search 2.5rem; buttons: `xl` for primary CTAs, `lg` secondary,
  `icon-lg` = 2.5rem). Fonts are locale-aware: an Arabic-script theme font is preceded by its Latin pair on en/tr
  (`fontStack(name, locale)`), which is what keeps Latin text centred in buttons. Navbars set `--navbar-h`/`--hero-pull`
  via `NAVBAR_VARS` on `[data-storefront]`, which sits INSIDE a separate `@container` wrapper (a container query never matches the
  element that declares it, so `@tablet:` variables on the container itself silently stayed at their phone values → 8 px white strip
  above the full-bleed hero under the floating/editorial bars; fixed 2026-09-09 in the storefront root, `PreviewFrame` and the harness); the full-bleed hero declares `data-hero-overlay` and slides under the bar, and overlay-capable bars
  (`data-navbar-overlay` + `NavScrollState`) go transparent at the top of the page. RTL: user content uses `bidi-auto`,
  phone numbers sit in `<bdi dir="ltr">`, steppers are `dir="ltr"`, display headings get `line-height: 1.3` under RTL.
  Wordmarks size with `cqw`, never `vw`. Screenshot loop: `scratchpad/audit-shots.mjs` (+ `audit-extra`, `audit-admin`,
  `nav-shots`, `quick-shots`; run with `MSYS_NO_PATHCONV=1`) and three reviewer agents per pass.
- **Account sections follow the fast-admin rule (2026-09-09)**: `account/layout.tsx` loads orders, addresses, wishlist and profile in ONE query wave (inside Suspense) and renders all four panels; `AccountPanels` (client) switches them with local state + `history.pushState`, which Next mirrors into `usePathname` (Back/Forward and deep links keep working). The `/account/*` pages are empty deep-link stubs. Measured: ~80 ms per switch, zero requests.
- **Navbars (2026-09-09)**: locale chip from `@desktop` in all four bars (drawer footer below); search field never truncates its
  placeholder (needs ~181 px → `w-48` minimum, icon-only search at `@tablet` in classic/split/pill); category budget = Shop + Brands
  until `@wide` then categories #1–#3 for classic/pill/split, #1–#3 from `@tablet` and #1–#5 at `@wide` for the stacked bar (own row);
  side cells of split/stacked headers are `minmax(0,1fr)` so the wordmark stays on the page centre; the bold marquee box is `dir="ltr"`
  with `dir="auto"` text spans (a `w-max` track overflows to the unreachable side under RTL). `StoreLogo` takes `wordmarkClassName`/
  `markClassName` instead of child selectors. The stacked bar shows the store phone at `@wide`.
- **Footer content (2026-09-09)** lives in `stores.settings` (`address`, `opening_hours` per locale; `social_links`; `trust_enabled`;
  `trust_items` ≤4; `payment_methods`), read through `src/lib/theme/footer.ts` (`Store.footer`), edited under Admin → Settings →
  Contact & footer (`FooterForm`, one JSON field, `updateFooterAction`). `buildFooterProps` (`src/components/storefront/footer-props.tsx`)
  turns store + settings into `FooterProps` for the live chrome AND the previews (fixture `fixtureFooterContent`), applying the four
  default trust promises from `footer.trust.*` when the list is empty. Shared pieces: `trust-strip`, `contact-block`, `social-links`
  (inline SVG brand glyphs), `payment-badges` (text pills). Trust strip defaults ON; payment badges hidden until methods are picked.
- Hero content is a SLIDE LIST in `stores.settings.hero_slides` (`[{image, title{locale}, subtitle{locale}, link}]`, max 8), read through
  `src/lib/theme/hero.ts` (`Store.hero.slides`); rows that only have the legacy `hero_image`/`hero_title`/`hero_subtitle` read as one slide and
  saving mirrors slide 1 back into those keys. One slide = plain hero; 2+ = every hero layout becomes a cross-fade carousel
  (`shared/hero-carousel.tsx` + `shared/use-carousel.ts`: swipe, arrow keys, dots, 6 s autoplay paused on hover/focus/reduced-motion,
  RTL-aware; only slide 1 renders an `<h1>`). Edited on the Design page (`HeroCard`: add/remove/reorder, upload, per-locale copy,
  same-site `link`), saved by `saveThemeAction`; new image URLs must be inside `store-media/<storeId>/`. Admin previews pass
  `autoplay: false`. Product pages use `shared/product-gallery.tsx` (same hook: stage cross-fade, thumbnails, hover arrows, `n / total`).
  `slideOf`/`imageOf` labels are `{n}`/`{total}` templates read with `t.raw` and filled client-side.
- Permission matrix lives only in `src/lib/auth/permissions.ts`. Server actions check it before using
  the service-role client.
- Payment providers implement `src/lib/payments/provider.ts`. `manual` is live; `iyzico` is a stub.
- Next.js 16 differs from older training data: read `node_modules/next/dist/docs/` before using an
  API you are unsure about (see `AGENTS.md`). Middleware is `src/proxy.ts`.
- **Fast admin (owner rule, copied from KaguOs)**: router `staleTimes` (30s dynamic) keeps visited
  pages warm; tab-like views render EVERY panel up front on the server and switch with local state
  (`TabbedPanels`, URL mirrored via `history.replaceState`); list pages with status tabs preload page 1
  of every bucket in one `Promise.all` wave when the URL carries only `status` (`isPlainList`);
  quick actions are optimistic — flip first, roll back on a rejected result (`useOptimisticAction` +
  the cross-cell `optimistic-store`); React `cache()` dedupes `adminContext`; `loading.tsx` streams.
  New admin surfaces must follow this: no spinner where a pre-rendered panel or an optimistic patch will do.
  Server side: sessions are verified locally (`supabase.auth.getClaims()`, ES256 + cached JWKS — never
  `getUser()` on a hot path), `listStores` is `"use cache"` under the `stores` tag, list pages run counts +
  every bucket in ONE `Promise.all`, and sidebar links use `prefetch={true}` so the full page (data included)
  is in the client cache before the click (re-prefetched on hover after `staleTimes.static` = 60 s).
- Theme fonts: the five `FONT_OPTIONS` (`src/lib/theme/fonts.ts`) are loaded once by the root layout;
  `themeToCssVars` maps the store's choice to `--font-sans` / `--heading-font`, Vazirmatn is always the
  Persian fallback. Add a font = add it to `fonts.ts` AND to the `next/font` block in `[locale]/layout.tsx`.

## Current status (2026-09-08, evening)
Done (build, typecheck, lint, 25 pgTAP tests green; every flow below verified with Playwright against the cloud project):
- Steps 1–4 as before (repo, schema, tenant proxy/auth, storefront theme A).
- **UI foundation**: every control is custom (Base UI shadcn Select/Checkbox/RadioGroup/Combobox/NumberField…; no native select/checkbox/radio/number/date/color anywhere); OverlayScrollbars on the document and scroll containers (no layout shift, RTL-mirrored); `DirectionProvider` mounted; Latin-only inputs (`LatinInput`) stay LTR under `fa`; navbar redesign with logo slot, pill nav (3 categories, 5 at xl, rest via Shop/drawer) and an animated hamburger drawer.
- **Phone onboarding**: `profiles.phone` (E.164, unique) + `phone_country`; `PhoneField` (country Combobox + LTR number, `libphonenumber-js` server-side); required at sign-up and enforced by a one-time `/complete-profile` screen (account, checkout, admin, sign-in, OAuth callback).
- **Step 5 admin — all modules built**: dashboard, orders (lifecycle + emails + refunds), products (translations, options/variants, images, categories), inventory (adjustments = stock movements, log), customers (`v_customer_stats`), coupons, reviews, finance (overview, margins, expenses), design (theme editor + live preview + branding upload), settings (general/commerce/pages/shipping), staff (invite/role/remove). Shell: Suspense frame (`instant = false`), mobile Sheet nav, DropdownMenu user menu, breadcrumbs, shared `StatusTabs`/DataTable/toolbar/dialog components under `src/components/admin/shared/`.
- **Multi-store (hidden)**: `/admin/stores` list + 7-step create wizard + domain actions, gated by `FEATURE_MULTI_STORE` AND platform owner (`requireMultiStore`). On locally (`.env.local`) so `testuser@gmail.com` (platform owner on the cloud project, password `12345678`) can use it; keep it off in Vercel.
- **Themes B–D (2026-09-08, late)**: every section now has `bold`, `editorial` and `playful` variants (48 files, all registered; the design editor and wizard show no "coming soon"). Verified in `/en|fa/preview/<variant>` at 390/1280: no overflow, no native controls. Theme fonts now really apply to the storefront.
- **Speed pass (2026-09-08, late)**: `staleTimes`; Settings is one page with four pre-rendered panels (`?tab=`, old sub-routes redirect); Orders/Products/Reviews preload every status bucket and switch tabs with zero requests; optimistic featured/active/tracking switches, product status, review moderation, order status transitions and staff roles, all with rollback; sidebar links show a pending pulse. Verified with `node_modules/.qa/speed-qa.mjs`.
- **Navigation speed (2026-09-08, night)**: sidebar click → painted page went from ~1.3 s to ~130 ms on Vercel (full prefetch + router cache); raw server render of an admin page from ~1.0–1.4 s to ~0.2–0.4 s (region fra1, local JWT verification, cached store list, single query wave). Measure with `node_modules/.qa/nav-timing.mjs <base> <rounds> <settleMs>`.
- **Client catalog model (2026-09-08, night)**: categories are a TREE and a parent lists its whole subtree (`categorySubtreeIds` in `src/lib/catalog/queries.ts`; child chips + parent breadcrumb on `/c/<slug>`; nested drawer). New BRANDS taxonomy: migration `20260908001000_brands.sql` (table `brands`, `products.brand_id`, free-text `products.brand` dropped), admin module `src/lib/admin/brands/*` + `/admin/products/brands`, product form brand Select, storefront `/brands`, `/b/<slug>`, brand filter on `/shop`, "Brands" nav link. Live catalog restructured with `node_modules/.qa/cloud-catalog.mjs` (8 brands, 12 categories, 25 products) and the seed mirrors it.
- **Shipping cost at sale (2026-09-08, night)**: migration `20260908001100_shipping_cost.sql` — `shipping_rates.cost` (what the store pays the courier), `orders.shipping_cost` copied at checkout even when the customer ships free, editable in the Ship dialog, shown on the order, netted in Finance (`v_daily_sales.shipping_cost`). Verified live: order 2609-01003 (free shipping) carries cost 3500. Standard rate on the cloud is set to 35.00; Express still 0 — the client sets real figures in Settings → Shipping.
- **Brand palette (2026-09-08)**: colours taken from the client's app icon (paw: teal-blue + orange) → primary #157fa1 (AA on white), accent #f7a83b, foreground #17323d, muted #eef8fb. Applied to the live theme via the Design page (`node_modules/.qa/apply-palette.mjs`) and to the seed. No logo file yet (the icon was "not the official file") — the monogram slot stays.
- **Deployment**: https://petati.vercel.app is live against the cloud project (env vars set in the Vercel dashboard); all admin routes render there with zero console errors (multi-store routes 404 by design, flag off).
- **Visual QA pass (2026-09-09, after the owner's review)**: root cause found and fixed (flex-column root shrink-wrapped every `mx-auto` page/section → truncated cards, off-centre checkout/cart/product/account); English/Turkish now render in a Latin face (Vazirmatn only leads on `fa`), which removed the "text sits high" look; shop-sized controls (44 px inputs, `xl` CTAs, 40 px icon buttons); one `px-gutter` inset everywhere; navbar over the full-bleed hero (transparent at top, solid on scroll) and decongested/centred navbars with a search field that never truncates; visible wishlist heart for everyone (guests → sign-in); RTL isolation (`bidi-auto`, `<bdi>` phone numbers, LTR steppers, looser Persian heading leading); cart lines centred, tax row reads "Includes tax" when prices include tax; checkout summary first on phones; account shell redone (card + icon nav / segmented row); drawer rail, admin save bar only when dirty, navbar previews drawn over the hero. Verified with two full screenshot audits (276 shots), the three reviewer agents, qa/admin-qa/design-qa scripts and a production build.
- **Storefront restyle + honest design picker (2026-09-09)**: live (minimal) language = full-bleed hero with overlay copy, overlay category tiles 3-up, overlay product cards 3-up desktop / 1-up mobile, category page banner. Every section has four structurally different layouts (48 files rewritten). Admin Design: each option is the REAL section rendered with fixture data inside a zoomed `@container` frame (`PreviewFrame`), desktop/mobile toggle, colours/fonts/radius live; the side "Live preview" is the home page composed from the chosen layouts; hero card (upload + per-locale copy); wizard preset cards show composed previews. Verified: harness at 390/1280 en+fa no overflow, admin-qa/qa scripts green, build green. Design page document (52 pre-rendered nodes) measured on `next start` 2026-09-09: 891 KB raw / 69 KB gzip / 42 KB brotli, DOMContentLoaded ≈ 300 ms warm (`node_modules/.qa/design-size.mjs`), so previews stay pre-rendered; revisit lazy loading only if that grows.
- **Navbars fixed + rich, distinct footers (2026-09-09)**: bold marquee now visible under Persian; split wordmark centred at every width; locale chip/search/category budget consistent (see Conventions); four structurally different, complete footers (four columns / dark wordmark with big phone / centred masthead with dot-separated links / rounded panel with contact card) each with a trust strip, address, hours, social links, payment badges, About + My account links; new Settings → Contact & footer tab. Verified: `chrome-qa.mjs` (4 layouts × en/fa × 390/768/1024/1280: overflow, placeholder fit + nav/end gap, wordmark centre, marquee visibility, footer completeness), `footer-admin-qa.mjs` (save/restore through the admin, https validation), `design-qa.mjs` (49 frames, device flip; document now 1.14 MB raw vs 891 KB before — footers are taller), screenshot sheets reviewed, lint/typecheck/build green. Light petvoda.com inspiration only (contact-heavy footer, trust strip, phone in the header).
- **Hero carousel + product gallery + navbar gap (2026-09-09)**: hero is now a slide list (see Conventions) with a carousel in all four layouts; the product page gallery actually works (thumbnails switch the stage, swipe, keys, counter) in minimal/bold/playful (editorial stays a stacked lookbook); the 8 px white strip above the hero under the floating/editorial navbars is gone (`@container` moved to a wrapper). Verified: `carousel-qa.mjs` (geometry at 390/768/1280, 4 layouts × en/fa: dots, keys, swipe, click guard, inert, one h1; gallery thumbs/arrows/keys/counter), `hero-admin-qa.mjs` (sign in, add slides with uploads, save, live 2-slide carousel with autoplay, restore; `--clear` empties the list), `carousel-shots.mjs` screenshot sweep reviewed, lint/typecheck/production build green. The live test store was left with ZERO slides (as found); three test banners remain as orphans in `store-media/<id>/hero/`.
In progress: nothing. Not started: iyzico, rich text editor, CSV export, DNS verification, Google OAuth secret paste (owner), SMTP for staff invites.

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
- `src/components/storefront/sections/types.ts` — the props contract every variant must honour; `<section>/{minimal,bold,editorial,playful}.tsx` are the four implementations, all wired in `src/lib/theme/registry.tsx`.
- `src/lib/theme/{preview.tsx,preview-compose.ts,client-registry.ts,hero.ts,fixtures.ts}` — `buildSectionPreviews` (server: every section × variant with fixtures, 16 grid×card combos; harness gets `fixtureHeroSlides`), `composeHome`, client-renderable hero/announcement registries (live typing in the editor), hero slide model + settings read/write.
- `src/lib/theme/footer.ts`, `src/components/storefront/footer-props.tsx`, `src/components/storefront/shared/{trust-strip,contact-block,social-links,payment-badges}.tsx`, `src/components/admin/settings/footer-form.tsx` — footer/contact settings model, the props builder, the footer building blocks and the admin tab.
- `src/components/storefront/shared/{use-carousel.ts,hero-carousel.tsx,product-gallery.tsx}` — carousel behaviour hook, the hero carousel (tones/controls per layout) and the product photo gallery.
- `src/components/admin/design/{theme-editor,section-picker,preview-frame,hero-card,logo-uploader}.tsx` — the Design page; `PreviewFrame` = zoomed `@container` box with the draft's CSS vars, `inert`.
- `src/lib/theme/fonts.ts` — font allow-list + CSS stacks (see Conventions).
- `src/lib/admin/brands/*`, `src/components/admin/products/brand-{list,dialog}.tsx` — brands admin; storefront brand pages under `src/app/[locale]/s/[store]/{brands,b/[slug]}/`, `shared/brand-mark.tsx`, `shared/category-nav.ts` (drawer tree).
- `node_modules/.qa/*.mjs` (untracked) — Playwright QA: `admin-qa`, `speed-qa`, `nav-timing`, `fa-qa`, `catalog-live-qa`, `shipping-cost-qa`, `orders-qa`, `apply-palette`, `cloud-catalog` (one-off data restructure, idempotent, `--local` flag), `design-qa` (Design page: frames flip per device, errors, document bytes), `shot-pages` + `png-diff` (full-page screenshots of storefront/harness and pixel diff), `overflow-probe`, `wizard-check`.
- `src/components/admin/shared/{tabbed-panels,optimistic-store,use-optimistic-action,optimistic-status-badge}.tsx` — the speed toolkit (see Conventions); `isPlainList` in `src/lib/admin/list-params.ts`.
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
6. ~~Themes B, C, D~~ (done 2026-09-08)
7. **← NEXT (owner-side)** Deploy readiness leftovers: paste the Google OAuth client secret into Supabase (everything else is staged), add `https://petati.vercel.app/auth/callback` + `http://localhost:3000/auth/callback` to Supabase Auth → URL configuration → Redirect URLs, Resend key, SMTP for staff invites, wildcard domain when multi-store is paid
8. Client logo + brand colours + a real wide hero photo (Design page → Hero), iyzico when credentials arrive

## Deliberately partial — grows later (scope ledger)
| Area | What shipped now | Intended full shape | Grows in |
|---|---|---|---|
| Multi-store | Built, hidden behind `FEATURE_MULTI_STORE` + Owner | Visible "Create store" wizard, domains UI | When client pays |
| Payments | `manual` provider (order = pending_payment, admin marks paid) | iyzico checkout + webhooks + refunds | When client supplies iyzico credentials |
| Footer content | Address, hours, socials (5 networks), trust strip (≤4), payment badges from settings | Contact page/route, map embed, more networks | When asked |
| Themes | Four structurally distinct layouts per section, previewed for real in admin | Per-section options (e.g. hero height, card aspect), theme-specific animations | As requested |
| Design previews | 52 nodes pre-rendered per page load (fixtures, 6 products per grid) | Lazy per-section loading via a server function if the page grows heavy | If measured slow |
| Admin lists | Buckets preloaded only for a "plain" URL (just `status`); search/date/category/page/sort go back to server paging | Client-side filtering over a larger preloaded window | If lists grow |
| Optimistic UI | Toggles, statuses, moderation, roles, order transitions | Optimistic create/delete rows (needs client-owned tables) | As needed |
| Brands | Name/slug/logo/active; product ↔ one brand; brand pages + shop filter | Brand descriptions/translations, brand filter in the admin products toolbar (`?brand=<id>` already works) | When asked |
| Categories | Tree via `parent_id`; storefront lists subtrees; drawer nests one level | Deeper nesting in desktop nav (mega menu), category images per child | When asked |
| Shipping cost | Per-rate courier cost copied to the order; editable when shipping; finance nets it | Per-order weight/zone pricing, courier API costs | When asked |
| Content pages | privacy/terms/about read plain text from `store.settings.pages` | Rich text editor in admin | Step 5 |
| Admin | All modules live | Rich text for pages/descriptions, CSV export, SQL aggregates for counts | As needed |
| Phone | Unique E.164 per account; emoji flags (letter pairs on Windows) | SVG flags; OTP login | Later |
| Staff invites | Supabase built-in SMTP only mails project members → falls back to creating the user silently | Real SMTP/Resend for invites | Deploy readiness |
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
- **Locale under Cache Components**: the root layout's `setRequestLocale` is part of the static shell and is NOT replayed in a dynamic resume, so any page/layout that renders dynamically without its own `setRequestLocale(locale)` fell back to English (seen on /fa/account). Every page now calls it (storefront pages via `storeContext`), and `src/i18n/request.ts` falls back to the `x-locale` REQUEST header the proxy forwards. Keep both when adding pages.
- The Design editor's `<form>` holds only hidden inputs (Save uses `form="theme-form"`) and the store wizard is a `<div>`: the previews contain their own forms (search, newsletter, checkout) and nested forms break hydration.
- `admin.design.preview.*` mock strings were removed; layout names/descriptions live under `admin.design.layouts.<section>.<key>` in all three locales (96 strings each).
- Theme fonts: Latin-only fonts are paired with an Arabic face for Persian (`FONTS[...].pair` in `src/lib/theme/fonts.ts`); Arabic-script fonts render Persian directly. Verify with `node_modules/.qa/fa-qa.mjs <base>` (it temporarily changes the live theme font and reverts).
- QA scripts live in `node_modules/.qa/*.mjs` (untracked): sign in as testuser, exercise each module with Playwright (Edge channel). `speed-qa.mjs` covers tabs/optimistic/themes; `admin-qa.mjs <base>` works against Vercel too.
- `TabbedPanels` uses `history.replaceState` (Next syncs `useSearchParams`); it must sit inside a Suspense boundary (it does — the page's list child). Panels stay mounted but `hidden`, so forms in inactive tabs keep their state.
- `optimistic-store` clears a key once the server prop equals the patch; if a server refresh returns a DIFFERENT value than the optimistic one (race), the patch stays until the action's rollback/next reconcile — call `clearOptimistic` in error paths.
- The old `/admin/settings/{commerce,pages,shipping}` routes are redirect stubs; link to `/admin/settings?tab=…` instead.
- **Vercel region**: `X-Vercel-Id: fra1::…` only names the edge PoP that served you — the function ran in `iad1` until `vercel.json` pinned `regions: ["fra1"]`. Verify with `process.env.VERCEL_REGION` from inside a route, not from headers. Each Supabase call from fra1 is still ~40–60 ms (PostgREST + TLS), so sequential waves are what to hunt.
- Next.js private folders: a route under `app/api/_name/` never becomes a route (underscore = private). The proxy matcher now skips `/api/` entirely (no locale redirect for API routes).
- After ANY direct data change on the cloud (scripts, SQL), the storefront's "use cache" entries (hours) keep serving old catalog/shipping data until a tag is updated: toggle a brand or save a category (`catalogTag`), re-save a shipping rate (`shipping:<storeId>`). `catalog-live-qa.mjs` does exactly that.
- PostgREST's schema cache on the cloud lags a `db push` by ~10–20 s ("Could not find the table … in the schema cache") — retry.
- Product QA: `rope-tug-toy` shows "Out of stock" on the live store now (earlier QA orders drained it); `orders-qa.mjs` uses `royal-canin-kitten`.
- The client's app icon reads "petitati" (and the mailbox is petitati.ist@gmail.com) while the store/site is named "Petati" everywhere — confirm the spelling with the client before the logo lands.
- `getClaims()` refreshes an expired session through `getSession()` regardless of `autoRefreshToken`, so the proxy still rotates cookies; the JWKS is cached process-wide by auth-js (`GLOBAL_JWKS`).

- `design-qa.mjs` looks for `[role=img][aria-label] [data-storefront]` (descendant, not child): the preview frame's `@container` wrapper sits above the `data-storefront` node since the navbar-variable fix.
- `next dev` can wedge with `Jest worker encountered 2 child process exceptions` (every request 500s, log at `.next/dev/logs/next-development.log`); it refuses a second instance in the same dir, so stop the PID it names and start again.

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
