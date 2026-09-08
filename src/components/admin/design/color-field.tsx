"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Curated palette shown in the swatch popover (Tailwind 500/700 hues + neutrals). */
const PALETTE = [
  "#ffffff", "#f5f5f4", "#e7e5e4", "#a8a29e", "#57534e", "#292524", "#0c0a09", "#000000",
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#0f766e", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#b91c1c", "#c2410c", "#b45309", "#4d7c0f", "#15803d", "#0e7490",
  "#1d4ed8", "#4338ca", "#6d28d9", "#be185d", "#1c1917", "#fafaf9", "#fef3c7", "#dbeafe",
];

const HEX_RE = /^#[0-9a-f]{6}$/i;

interface Props {
  name: string;
  id?: string;
  label?: React.ReactNode;
  defaultValue: string;
  /** Controlled value; when given, `defaultValue` is only the initial fallback. */
  value?: string;
  onChange?: (hex: string) => void;
  className?: string;
}

/**
 * Hex colour input + swatch button opening a palette popover. Replaces the native
 * `<input type="color">` (forbidden by the UI rules). Always submits a 6-digit lowercase hex.
 */
export function ColorField({ name, id = name, label, defaultValue, value, onChange, className }: Props) {
  const t = useTranslations("admin.design");
  const [internal, setInternal] = useState(defaultValue);
  const [text, setText] = useState(value ?? defaultValue);
  const current = value ?? internal;

  // Controlled usage: adopt a new external value (derived-state pattern, no effect needed).
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    if (value !== undefined) setText(value);
  }

  function commit(next: string) {
    const hex = next.trim().toLowerCase();
    if (!HEX_RE.test(hex)) return;
    setInternal(hex);
    setText(hex);
    onChange?.(hex);
  }

  const invalid = !HEX_RE.test(text);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger
            render={
              <Button type="button" variant="outline" size="icon" aria-label={t("pickColor")} className="shrink-0 overflow-hidden p-0.5" />
            }
          >
            <span aria-hidden className="block size-full rounded-sm border border-black/10" style={{ backgroundColor: current }} />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-2">
            <div className="grid grid-cols-8 gap-1">
              {PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={hex}
                  aria-pressed={hex === current}
                  onClick={() => commit(hex)}
                  className={cn(
                    "size-6 rounded-md border border-black/10 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    hex === current && "ring-2 ring-ring ring-offset-1",
                  )}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Input
          id={id}
          dir="ltr"
          value={text}
          spellCheck={false}
          autoComplete="off"
          maxLength={7}
          aria-invalid={invalid || undefined}
          className="font-mono text-start uppercase tabular-nums"
          onChange={(e) => {
            const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            setText(v);
            if (HEX_RE.test(v)) commit(v);
          }}
          onBlur={() => {
            if (invalid) setText(current);
          }}
        />
        <input type="hidden" name={name} value={current} />
      </div>
    </div>
  );
}
