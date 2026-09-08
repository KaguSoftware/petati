"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PALETTE_SWATCHES } from "@/lib/admin/stores/defaults";
import { HEX_RE } from "@/lib/admin/stores/schema";
import { cn } from "@/lib/utils";

interface Props {
  /** Hidden input name, so the field works inside plain server-action forms. */
  name: string;
  id?: string;
  label?: React.ReactNode;
  defaultValue: string;
  /** Controlled value (optional). */
  value?: string;
  onChange?: (hex: string) => void;
  swatches?: string[];
  className?: string;
  "aria-invalid"?: boolean;
}

/**
 * Hex colour field: text input (LTR, validated as #rrggbb) + a swatch button opening a palette
 * popover. No native `<input type="color">` (owner's UI rule). Reusable by the design module.
 */
export function ColorField({ name, id, label, defaultValue, value, onChange, swatches = PALETTE_SWATCHES, className, ...rest }: Props) {
  const t = useTranslations("stores.color");
  const autoId = useId();
  const inputId = id ?? `${autoId}-color`;
  const [internal, setInternal] = useState(defaultValue);
  const current = (value ?? internal).toLowerCase();
  const [text, setText] = useState(current);
  const [synced, setSynced] = useState(current);
  if (synced !== current) {
    // Derived state: an external change (draft restore, palette pick) refreshes the text field.
    setSynced(current);
    setText(current);
  }
  const [open, setOpen] = useState(false);

  function commit(hex: string) {
    const v = hex.toLowerCase();
    setInternal(v);
    onChange?.(v);
  }

  function onText(next: string) {
    const v = next.startsWith("#") ? next : `#${next}`;
    setText(v);
    if (HEX_RE.test(v)) commit(v);
  }

  const invalid = !HEX_RE.test(text);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={<Button type="button" variant="outline" size="icon" aria-label={t("pick")} className="shrink-0 p-1" />}
          >
            <span aria-hidden className="size-full rounded-md border border-foreground/10" style={{ backgroundColor: current }} />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto">
            <p className="px-0.5 text-xs font-medium text-muted-foreground">{t("palette")}</p>
            <div className="grid grid-cols-6 gap-1.5" role="listbox" aria-label={t("palette")}>
              {swatches.map((hex) => {
                const selected = hex.toLowerCase() === current;
                return (
                  <button
                    key={hex}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    aria-label={hex}
                    title={hex}
                    onClick={() => {
                      commit(hex);
                      setOpen(false);
                    }}
                    className={cn(
                      "grid size-7 place-items-center rounded-md border border-foreground/10 outline-none transition-transform hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50",
                      selected && "ring-2 ring-ring ring-offset-1 ring-offset-background",
                    )}
                    style={{ backgroundColor: hex }}
                  >
                    {selected && <Check className="size-3.5 mix-blend-difference text-white" />}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        <Input
          id={inputId}
          dir="ltr"
          value={text}
          onChange={(e) => onText(e.target.value)}
          onBlur={() => {
            if (invalid) setText(current);
          }}
          aria-label={typeof label === "string" ? label : t("hex")}
          aria-invalid={rest["aria-invalid"] || invalid || undefined}
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          className="font-mono text-sm uppercase tabular-nums"
        />
        <input type="hidden" name={name} value={current} />
      </div>
    </div>
  );
}
