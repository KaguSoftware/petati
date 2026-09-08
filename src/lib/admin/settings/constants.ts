/** Currencies the store may trade in (ISO 4217). Money is stored in minor units of this currency. */
export const CURRENCIES = ["TRY", "USD", "EUR", "GBP", "IRR", "AED", "SAR"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Content pages editable under Settings → Pages; the storefront reads `settings.pages.<key>.<locale>`. */
export const CONTENT_PAGES = ["privacy", "terms", "about"] as const;
export type ContentPage = (typeof CONTENT_PAGES)[number];

/** `Name <a@b.c>` or a bare address. */
export const EMAIL_FROM_RE = /^(?:[^<>@]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/;
