"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { localeNames, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface Props {
  /** The store's enabled locales, in display order. */
  locales: readonly Locale[];
  value: Locale;
  onValueChange: (locale: Locale) => void;
  /** Locales whose required field is still empty get a warning dot. */
  missing?: readonly Locale[];
  /** The store default locale (marked as required). */
  required?: Locale;
  className?: string;
}

/** Tab strip to switch the locale being edited in translated forms. Content is rendered by the caller. */
export function LocaleTabs({ locales, value, onValueChange, missing = [], required, className }: Props) {
  const t = useTranslations("admin.common");
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as Locale)} className={className}>
      <TabsList aria-label={t("translations")}>
        {locales.map((l) => {
          const isMissing = missing.includes(l);
          return (
            <TabsTrigger key={l} value={l} className="gap-1.5 px-2.5">
              <span lang={l}>{localeNames[l]}</span>
              {required === l && (
                <span aria-hidden className="text-destructive">
                  *
                </span>
              )}
              {isMissing && <span aria-label={t("required")} className={cn("size-1.5 rounded-full", required === l ? "bg-destructive" : "bg-amber-500")} />}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
