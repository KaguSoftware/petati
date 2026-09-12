"use client";

import { CalendarIcon, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { enUS, faIR, tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useListNavigation } from "./table-toolbar";
import { dateTimeFormat } from "@/lib/number";

const LOCALES = { en: enUS, tr, fa: faIR } as const;

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parse(s: string | null): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Writes `from` / `to` (ISO dates) to the URL. Presets: last 7 / 30 days, this month, last month. */
export function DateRangePicker({ className }: { className?: string }) {
  const t = useTranslations("admin.common");
  const locale = useLocale() as keyof typeof LOCALES;
  const { params, setParams } = useListNavigation();
  const [open, setOpen] = useState(false);
  const from = parse(params.get("from"));
  const to = parse(params.get("to"));
  const [draft, setDraft] = useState<DateRange | undefined>(from ? { from, to } : undefined);
  const fmt = dateTimeFormat(locale, { day: "numeric", month: "short" });

  function apply(range: DateRange | undefined) {
    setParams({ from: range?.from ? iso(range.from) : null, to: range?.to ? iso(range.to) : range?.from ? iso(range.from) : null });
    setOpen(false);
  }
  function preset(kind: "7" | "30" | "month" | "lastMonth") {
    const now = new Date();
    let range: DateRange;
    if (kind === "7" || kind === "30") {
      const start = new Date(now);
      start.setDate(now.getDate() - (kind === "7" ? 6 : 29));
      range = { from: start, to: now };
    } else if (kind === "month") range = { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    else range = { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0) };
    setDraft(range);
    apply(range);
  }

  const label = from ? `${fmt.format(from)} – ${fmt.format(to ?? from)}` : t("dateRange");

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
          <CalendarIcon />
          <span className="tabular-nums">{label}</span>
          {from && (
            <span
              role="button"
              aria-label={t("remove")}
              className="-me-1 rounded-sm p-0.5 hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                setDraft(undefined);
                apply(undefined);
              }}
            >
              <X className="size-3.5" />
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="flex flex-row flex-wrap gap-1 border-b p-2 sm:flex-col sm:border-e sm:border-b-0">
              {(["7", "30", "month", "lastMonth"] as const).map((k) => (
                <Button key={k} variant="ghost" size="sm" className="justify-start" onClick={() => preset(k)}>
                  {t(`presets.${k === "7" ? "last7" : k === "30" ? "last30" : k === "month" ? "thisMonth" : "lastMonth"}`)}
                </Button>
              ))}
            </div>
            <div className="p-2">
              <Calendar mode="range" numberOfMonths={1} selected={draft} onSelect={setDraft} locale={LOCALES[locale] ?? enUS} dir={locale === "fa" ? "rtl" : "ltr"} />
              <div className="flex justify-end gap-2 border-t pt-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button size="sm" onClick={() => apply(draft)} disabled={!draft?.from}>
                  {t("confirm")}
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
