import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { ExpenseTotals } from "@/lib/admin/finance/types";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { numberFormat } from "@/lib/number";

interface Props {
  data: ExpenseTotals;
  currency: string;
  locale: string;
}

/** Expense totals per category with CSS bars, plus a link to manage expenses. */
export async function ExpensesByCategory({ data, currency, locale }: Props) {
  const t = await getTranslations("admin.finance");
  const money = (n: number) => formatMoney(n, currency, locale);
  const pct = numberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const max = Math.max(0, ...data.rows.map((r) => r.total));

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">{t("byCategory.title")}</h2>
        <Link href="/admin/finance/expenses" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-me-2")}>
          {t("manageExpenses")}
        </Link>
      </div>
      {data.rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("byCategory.empty")}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {data.rows.map((r) => (
            <li key={r.category_id ?? "none"} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className={cn("min-w-0 truncate", !r.name && "text-muted-foreground italic")}>{r.name ?? t("byCategory.uncategorized")}</span>
                <span className="shrink-0 tabular-nums">
                  {money(r.total)}
                  <span className="ms-2 text-xs text-muted-foreground">{data.total > 0 ? pct.format(r.total / data.total) : ""}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary/70" style={{ width: `${max > 0 ? Math.max(2, (r.total / max) * 100) : 0}%` }} />
                </span>
                <span className="w-16 shrink-0 text-end text-xs text-muted-foreground tabular-nums">{t("byCategory.count", { count: r.count })}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="flex items-center justify-between border-t pt-3 text-sm">
        <span className="font-medium">{t("byCategory.total")}</span>
        <span className="font-semibold tabular-nums">{money(data.total)}</span>
      </div>
    </section>
  );
}
