"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/config";

export function LocaleSwitcher({ enabled }: { enabled?: readonly string[] }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();
  const options = locales.filter((l) => !enabled || enabled.includes(l));

  return (
    <select
      aria-label="Language"
      className="rounded-md border bg-background px-2 py-1 text-sm"
      value={locale}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as Locale;
        document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
        start(() => router.replace(pathname, { locale: next }));
      }}
    >
      {options.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}
