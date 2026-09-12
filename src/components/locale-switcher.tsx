"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface Props {
  /** Restrict to the store's enabled locales. */
  enabled?: readonly string[];
  /** `compact` shows an icon + locale code (navbar); `full` shows the language name. */
  variant?: "compact" | "full";
  className?: string;
}

export function LocaleSwitcher({ enabled, variant = "full", className }: Props) {
  const locale = useLocale();
  const t = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();
  const items = locales
    .filter((l) => !enabled || enabled.includes(l))
    .map((l) => ({ value: l, label: localeNames[l] }));

  return (
    <Select
      items={items}
      value={locale}
      modal={false}
      disabled={pending}
      onValueChange={(value) => {
        const next = value as Locale;
        if (!next || next === locale) return;
        document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
        start(() => router.replace(pathname, { locale: next }));
      }}
    >
      <SelectTrigger
        aria-label={t("language")}
        size="sm"
        /**
         * The `!`s are load-bearing. `SelectTrigger` packs its geometry into `data-[size=sm]:`
         * variants, which Tailwind emits AFTER plain utilities and which therefore beat anything
         * passed in here — so the old `rounded-full` silently lost to `data-[size=sm]:rounded-[…]`
         * and this rendered as a 10px-radius box, not a pill. The padding had a second problem:
         * this project's `cn` is the `cn` package, not `tailwind-merge`, and it does not treat
         * `px-*` as conflicting with the base `ps-*`/`pe-*`, which win on emission order. The old
         * `px-2.5` was dead too, leaving 8px on the chevron side.
         *
         * Asymmetric on purpose: the chevron needs less room after it than the icon needs before.
         */
        className={cn(
          variant === "compact" &&
            "h-10! gap-2 rounded-full! border-border/70 bg-transparent ps-3.5! pe-2.5! hover:bg-muted",
          className,
        )}
      >
        {variant === "compact" ? (
          <>
            <Languages className="text-muted-foreground" />
            <span className="text-caption font-medium uppercase tracking-wide">{locale}</span>
          </>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false}>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
