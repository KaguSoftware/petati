# Petati

E-commerce storefront and admin panel. Next.js 16, Supabase, Tailwind v4, shadcn/ui, next-intl
(English, Turkish, Farsi).

See `HANDOFF.md` for architecture, conventions, and current status.

## Development

```
npm install
cp .env.example .env.local
npx supabase start        # requires Docker Desktop
npx supabase db reset
npm run dev
```
