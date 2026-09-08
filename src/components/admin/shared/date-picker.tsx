"use client";

import { CalendarIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import { enUS, faIR, tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const LOCALES = { en: enUS, tr, fa: faIR } as const;

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parse(s: string | null | undefined): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

interface Props {
  /** Id for the trigger button (label `htmlFor`). */
  id?: string;
  /** Hidden input name; submits the ISO date ("YYYY-MM-DD") or "". */
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/** Single-date picker (Popover + Calendar) replacing native `type="date"`; writes an ISO date to a hidden input. */
export function DatePicker({ id, name, defaultValue, required, disabled, placeholder, className }: Props) {
  const locale = useLocale() as keyof typeof LOCALES;
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(() => parse(defaultValue));
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className={cn("w-full", className)}>
      <input type="hidden" name={name} value={date ? iso(date) : ""} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button id={id} type="button" variant="outline" className="w-full justify-start gap-2 font-normal" disabled={disabled} aria-required={required} />}
        >
          <CalendarIcon className="text-muted-foreground" />
          <span className={cn("tabular-nums", !date && "text-muted-foreground")}>{date ? fmt.format(date) : (placeholder ?? "—")}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={(d) => {
              if (d) setDate(d);
              setOpen(false);
            }}
            locale={LOCALES[locale] ?? enUS}
            dir={locale === "fa" ? "rtl" : "ltr"}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
