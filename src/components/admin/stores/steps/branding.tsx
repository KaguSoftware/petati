"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, X } from "lucide-react";
import { ColorField } from "@/components/admin/color-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LOGO_MAX_BYTES, LOGO_TYPES, RADIUS_OPTIONS } from "@/lib/admin/stores/defaults";
import type { RadiusPreset } from "@/lib/admin/stores/schema";
import { themeColorsSchema, type ThemeColors } from "@/lib/theme/types";
import { cn } from "@/lib/utils";
import { ThemePreviewCard } from "../theme-preview-card";
import type { StepProps } from "./types";

interface Props extends StepProps {
  logoPreview: string | null;
  logoName: string | null;
  onLogoChange: (file: File | null) => void;
}

const COLOR_KEYS = Object.keys(themeColorsSchema.shape) as (keyof ThemeColors)[];

export function BrandingStep({ draft, update, errors, logoPreview, logoName, onLogoChange }: Props) {
  const t = useTranslations("stores.branding");
  const tErr = useTranslations("stores.fieldErrors");
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function accept(file: File | undefined | null) {
    if (!file) return;
    if (!LOGO_TYPES[file.type]) return setLocalError(tErr("logoType"));
    if (file.size > LOGO_MAX_BYTES) return setLocalError(tErr("logoTooLarge"));
    setLocalError(null);
    onLogoChange(file);
  }

  const logoError = localError ?? errors.logo;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label>{t("logo")}</Label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              accept(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-5 text-center transition-colors",
              dragging && "border-primary bg-primary/5",
              logoError && "border-destructive",
            )}
          >
            {logoPreview ? (
              <div className="flex w-full items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- object URL preview */}
                <img src={logoPreview} alt="" className="size-14 shrink-0 rounded-lg border bg-white object-contain p-1" />
                <span className="min-w-0 flex-1 truncate text-start text-sm" dir="ltr">
                  {logoName}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => onLogoChange(null)}>
                  <X data-icon="inline-start" />
                  {t("removeLogo")}
                </Button>
              </div>
            ) : (
              <>
                <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
                  <ImagePlus className="size-5" />
                </span>
                <p className="text-sm text-muted-foreground">
                  {t("dropHere")}{" "}
                  <Button type="button" variant="link" size="sm" className="h-auto p-0 text-sm" onClick={() => fileRef.current?.click()}>
                    {t("chooseFile")}
                  </Button>
                </p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept={Object.keys(LOGO_TYPES).join(",")}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                accept(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          <p className={cn("text-sm", logoError ? "text-destructive" : "text-muted-foreground")}>{logoError ?? t("logoHint")}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Label>{t("colors")}</Label>
          <div className="grid gap-4 sm:grid-cols-2">
            {COLOR_KEYS.map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <ColorField
                  name={`colors.${key}`}
                  id={`colors.${key}`}
                  label={t(`colorNames.${key}`)}
                  defaultValue={draft.colors[key]}
                  value={draft.colors[key]}
                  onChange={(hex) => update({ colors: { ...draft.colors, [key]: hex } })}
                  aria-invalid={!!errors[`colors.${key}`]}
                />
                {errors[`colors.${key}`] && <p className="text-sm text-destructive">{errors[`colors.${key}`]}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label id="radius-label">{t("radius")}</Label>
          <RadioGroup aria-labelledby="radius-label" value={draft.radius} onValueChange={(v) => update({ radius: v as RadiusPreset })} className="grid-cols-2 sm:grid-cols-4">
            {RADIUS_OPTIONS.map((opt) => (
              <Label
                key={opt.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-primary/5",
                )}
              >
                <RadioGroupItem value={opt.value} />
                <span aria-hidden className="size-7 shrink-0 border-2 border-foreground/50 border-e-0 border-b-0" style={{ borderStartStartRadius: opt.value }} />
                <span className="text-sm">{t(`radiusNames.${opt.key}`)}</span>
              </Label>
            ))}
          </RadioGroup>
          {errors.radius && <p className="text-sm text-destructive">{errors.radius}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2 lg:sticky lg:top-20 lg:self-start">
        <Label>{t("preview")}</Label>
        <ThemePreviewCard colors={draft.colors} radius={draft.radius} name={draft.name} logoUrl={logoPreview} />
      </div>
    </div>
  );
}
