import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "./config";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Every locale is prefixed (/en, /tr, /fa). proxy.ts redirects the bare root to the
  // store's own default locale, so each store can have a different default language.
  localePrefix: "always",
});
