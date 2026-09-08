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
        className={cn(variant === "compact" && "h-9 rounded-full border-border/70 bg-transparent px-2.5 hover:bg-muted", className)}
      >
        {variant === "compact" ? (
          <>
            <Languages className="text-muted-foreground" />
            <span className="text-xs font-medium uppercase tracking-wide">{locale}</span>
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
