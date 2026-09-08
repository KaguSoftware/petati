"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { IntlProvider, type AbstractIntlMessages } from "use-intl";

/**
 * Pure client-side intl context. We deliberately avoid next-intl's server `NextIntlClientProvider`
 * because it awaits request-scoped config, which would make the whole root layout dynamic under
 * Cache Components. Server components keep using `getTranslations` from next-intl/server.
 *
 * `DirectionProvider` tells Base UI (Select, Combobox, Slider, popups…) which way is "start" so
 * keyboard navigation and inline-start/end positioning mirror correctly under `fa`.
 */
export function AppIntlProvider({
  locale,
  dir,
  messages,
  children,
}: {
  locale: string;
  dir: "ltr" | "rtl";
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  return (
    <IntlProvider locale={locale} messages={messages} timeZone="Europe/Istanbul">
      <DirectionProvider direction={dir}>{children}</DirectionProvider>
    </IntlProvider>
  );
}
