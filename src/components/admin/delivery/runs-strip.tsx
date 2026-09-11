import { Printer, Route } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { TodayRun } from "@/lib/admin/delivery/queries";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { EmptyState } from "../shared/empty-state";
import { EntityLink } from "../shared/entity-link";

interface Props {
  runs: TodayRun[];
  date: string;
  currency: string;
  locale: string;
  /** Compact strip on the board; full cards on the runs page. */
  variant?: "strip" | "cards";
  className?: string;
}

/**
 * Who is on the road today and with what. One tile per courier: open / done / failed counts, cash
 * still to collect, the cities, and the run sheet one click away. Doubles as the runs index page.
 */
export async function RunsStrip({ runs, date, currency, locale, variant = "strip", className }: Props) {
  const t = await getTranslations("admin.delivery.runs");
  if (runs.length === 0) {
    return variant === "cards" ? <EmptyState title={t("none")} description={t("noneHint")} /> : null;
  }
  const cards = variant === "cards";
  return (
    <div className={cn(cards ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" : "grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-2", className)}>
      {runs.map((r) => {
        const total = r.open + r.done + r.failed;
        const sheet = `/admin/delivery/runs/${r.courier.id}?d=${date}`;
        return (
          <article key={r.courier.id} className={cn("flex min-w-0 flex-col gap-2 rounded-xl border bg-card", cards ? "p-4" : "p-3")}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <EntityLink kind="courier" id={r.courier.id} label={r.courier.name} className="text-base" />
                {r.cities.length > 0 && <p className="truncate text-xs text-muted-foreground">{r.cities.slice(0, 3).join(" · ")}</p>}
              </div>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", r.open > 0 ? "bg-sky-500/10 text-sky-700 dark:text-sky-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300")}>
                {r.open > 0 ? t("stopsOpen", { count: r.open }) : t("stopsDone", { done: r.done, total })}
              </span>
            </div>
            <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground tabular-nums">
              {r.out > 0 && <span>{t("out", { count: r.out })}</span>}
              {r.done > 0 && r.open > 0 && <span>{t("stopsDone", { done: r.done, total })}</span>}
              {r.failed > 0 && <span className="text-destructive">{t("failed", { count: r.failed })}</span>}
              {r.cashExpected > 0 && <span>{t("cash", { amount: formatMoney(r.cashExpected, currency, locale) })}</span>}
            </p>
            <div className="mt-auto flex flex-wrap gap-2">
              <Link href={sheet} className={buttonVariants({ variant: cards ? "outline" : "ghost", size: "sm" })}>
                <Route data-icon="inline-start" />
                {t("openSheet")}
              </Link>
              {cards && (
                <Link href={`${sheet}&print=1`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  <Printer data-icon="inline-start" />
                  {t("print")}
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
