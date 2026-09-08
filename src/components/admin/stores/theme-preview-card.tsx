"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { DEFAULT_THEME, themeToCssVars, type ThemeColors } from "@/lib/theme/types";
import { cn } from "@/lib/utils";

interface Props {
  colors: ThemeColors;
  radius: string;
  name?: string;
  logoUrl?: string | null;
  className?: string;
}

/** Mini storefront mock re-skinned with the chosen colours and radius (inline CSS variables). */
export function ThemePreviewCard({ colors, radius, name, logoUrl, className }: Props) {
  const t = useTranslations("stores.branding");
  const vars = themeToCssVars({ ...DEFAULT_THEME, colors, radius }) as CSSProperties;
  return (
    <div style={vars} className={cn("overflow-hidden rounded-xl border bg-background text-foreground shadow-xs", className)} aria-label={t("preview")}>
      <div className="flex items-center justify-between gap-3 border-b border-muted px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- object URL preview
            <img src={logoUrl} alt="" className="size-6 rounded-sm object-contain" />
          ) : (
            <span aria-hidden className="size-6 rounded-sm bg-primary" />
          )}
          <span className="truncate text-sm font-semibold">{name || "Store"}</span>
        </div>
        <div aria-hidden className="flex gap-2">
          <span className="h-2 w-8 rounded-full bg-muted" />
          <span className="h-2 w-6 rounded-full bg-muted" />
          <span className="h-2 w-7 rounded-full bg-muted" />
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <h3 className="text-lg leading-tight font-semibold">{t("previewHeading")}</h3>
        <p className="text-sm text-muted-foreground">{t("previewBody")}</p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">{t("previewPrimary")}</span>
          <span className="inline-flex h-8 items-center rounded-lg border border-foreground/20 px-3 text-sm font-medium">{t("previewOutline")}</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
          <span aria-hidden className="size-12 shrink-0 rounded-lg bg-accent" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{t("previewCardTitle")}</p>
            <p className="truncate text-xs text-muted-foreground">{t("previewCardBody")}</p>
          </div>
          <span className="rounded-4xl bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{t("previewBadge")}</span>
        </div>
      </div>
    </div>
  );
}
