import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { routing } from "./routing";

/**
 * Locale resolution order:
 *  1. `setRequestLocale(locale)` from the rendering layout/page (static-safe; every page calls it).
 *  2. The `x-locale` request header the proxy forwards — only consulted when (1) is missing, which
 *     happens in a dynamic resume under Cache Components (the root layout is part of the static
 *     shell, so its call is not replayed). Reading headers there is fine: that scope is dynamic.
 *  3. The default locale.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  let requested = await requestLocale;
  if (!requested) {
    try {
      requested = (await headers()).get("x-locale") ?? undefined;
    } catch {
      // Static scope without a request: fall through to the default.
    }
  }
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
