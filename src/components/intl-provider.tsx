"use client";

import { IntlProvider, type AbstractIntlMessages } from "use-intl";

/**
 * Pure client-side intl context. We deliberately avoid next-intl's server `NextIntlClientProvider`
 * because it awaits request-scoped config, which would make the whole root layout dynamic under
 * Cache Components. Server components keep using `getTranslations` from next-intl/server.
 */
export function AppIntlProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  return (
    <IntlProvider locale={locale} messages={messages} timeZone="Europe/Istanbul">
      {children}
    </IntlProvider>
  );
}
