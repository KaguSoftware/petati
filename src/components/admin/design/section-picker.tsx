"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SECTION_KEYS, VARIANT_KEYS, type SectionKey, type StoreTheme, type VariantKey } from "@/lib/theme/types";
import { cn } from "@/lib/utils";
import { PreviewFrame, type PreviewDevice } from "./preview-frame";

interface Props {
  theme: StoreTheme;
  dir: "ltr" | "rtl";
  locale: string;
  device: PreviewDevice;
  onPick: (section: SectionKey, variant: VariantKey) => void;
  /** The node to draw for a section option (server-rendered previews, or live client renders). */
  nodeFor: (section: SectionKey, variant: VariantKey) => ReactNode;
}

/** Sections whose previews are long: cap the frame so four options still fit on a screen or two. */
const MAX_HEIGHT: Partial<Record<SectionKey, number>> = { announcementBar: 420, navbar: 420, productPage: 760, cartDrawer: 640, checkout: 720, reviews: 560, productGrid: 720, footer: 760 };

/**
 * One section at a time (list on the side), four layout options drawn for real. Every section's
 * options stay mounted (hidden) so switching sections is instant, per the fast-admin rule.
 */
export function SectionPicker({ theme, dir, locale, device, onPick, nodeFor }: Props) {
  const t = useTranslations("admin.design");
  const [active, setActive] = useState<SectionKey>("navbar");

  return (
    <div className="grid gap-4 md:grid-cols-[13rem_minmax(0,1fr)]">
      <nav aria-label={t("sections.picker")} className="-mx-1 flex flex-row gap-1 overflow-x-auto px-1 pb-1 md:flex-col md:overflow-visible md:pb-0">
        {SECTION_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            aria-current={active === key ? "true" : undefined}
            className={cn(
              "flex shrink-0 flex-col items-start gap-0.5 rounded-lg px-3 py-1.5 text-start text-sm whitespace-nowrap transition-colors",
              active === key ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span>{t(`sections.keys.${key}`)}</span>
            <span className="hidden text-[11px] font-normal text-muted-foreground md:inline">{t(`layouts.${key}.${theme.sections[key]}.name`)}</span>
          </button>
        ))}
      </nav>

      {SECTION_KEYS.map((key) => (
        <div key={key} hidden={key !== active} className="min-w-0">
          <RadioGroup
            value={theme.sections[key]}
            onValueChange={(v) => v && onPick(key, v as VariantKey)}
            aria-label={t(`sections.keys.${key}`)}
            className={cn("grid gap-4", device === "mobile" ? "sm:grid-cols-2" : "grid-cols-1")}
          >
            {VARIANT_KEYS.map((v) => {
              const selected = theme.sections[key] === v;
              return (
                <label
                  key={v}
                  className={cn(
                    "flex cursor-pointer flex-col gap-2 rounded-xl border p-2.5 transition-colors hover:bg-muted/40",
                    selected && "border-primary bg-primary/5 ring-2 ring-primary/25",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <RadioGroupItem value={v} />
                    <span className="text-sm font-medium">{t(`layouts.${key}.${v}.name`)}</span>
                    {selected && <span className="ms-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{t("sections.selected")}</span>}
                  </span>
                  <PreviewFrame
                    device={device}
                    theme={theme}
                    dir={dir}
                    locale={locale}
                    label={`${t(`sections.keys.${key}`)}: ${t(`layouts.${key}.${v}.name`)}`}
                    maxHeight={MAX_HEIGHT[key]}
                    className="rounded-lg border"
                  >
                    {key === active ? nodeFor(key, v) : null}
                  </PreviewFrame>
                  <span className="text-xs text-muted-foreground">{t(`layouts.${key}.${v}.description`)}</span>
                </label>
              );
            })}
          </RadioGroup>
        </div>
      ))}
    </div>
  );
}
