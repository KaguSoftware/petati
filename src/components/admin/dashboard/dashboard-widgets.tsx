import { AlertTriangle, Boxes, Star, TrendingUp, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Dashboard } from "@/lib/admin/dashboard/queries";
import { formatMoney, toMajor } from "@/lib/money";
import { cn } from "@/lib/utils";
import { EmptyState } from "../shared/empty-state";
import { KpiCard } from "../shared/kpi-card";
import { StatusBadge } from "../shared/status-badge";

export async function KpiGrid({ data, locale }: { data: Dashboard; locale: string }) {
  const t = await getTranslations("admin.dashboard");
  const money = (n: number) => formatMoney(n, data.currency, locale);
  const num = new Intl.NumberFormat(locale);
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3">
      {data.sales && <KpiCard label={t("revenue30d")} value={money(data.sales.paidGross - data.sales.refunds)} hint={t("ordersInPeriod", { count: data.sales.ordersCount })} icon={TrendingUp} />}
      {data.sales && <KpiCard label={t("margin30d")} value={money(data.sales.paidGross - data.sales.refunds - data.sales.cogs)} hint={t("afterCogs")} icon={Wallet} />}
      <KpiCard label={t("pendingPayment")} value={num.format(data.pendingPayment)} icon={AlertTriangle} tone={data.pendingPayment > 0 ? "warning" : "default"} />
      <KpiCard label={t("pendingReviews")} value={num.format(data.pendingReviews)} icon={Star} />
      <KpiCard label={t("lowStock")} value={num.format(data.lowStockCount)} icon={Boxes} tone={data.lowStockCount > 0 ? "warning" : "default"} />
    </div>
  );
}

/** Round a minor-unit amount up to a clean axis maximum (1-2-5 steps). */
function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 2.5, 5, 10]) if (max <= step * pow) return step * pow;
  return 10 * pow;
}

/**
 * Paid revenue over the last 30 days as a single-series column chart: one column per day
 * (zero-filled in the query), a hairline baseline and two gridlines, three date labels, the
 * highest day labelled directly, every column titled for hover. Server-rendered, no library.
 */
export async function SalesBars({ data, locale }: { data: Dashboard; locale: string }) {
  const t = await getTranslations("admin.dashboard");
  if (!data.sales) return null;
  const { days } = data.sales;
  const money = (n: number) => formatMoney(n, data.currency, locale);
  const compact = (n: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: data.currency, currencyDisplay: "narrowSymbol", notation: "compact", maximumFractionDigits: 1 }).format(toMajor(n, data.currency));
  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const total = days.reduce((a, d) => a + d.paid_gross, 0);
  const peak = Math.max(0, ...days.map((d) => d.paid_gross));
  const top = niceMax(peak);
  const peakIndex = days.findIndex((d) => d.paid_gross === peak);
  const ticks = [days[0], days[Math.floor(days.length / 2)], days[days.length - 1]].filter(Boolean);

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-medium text-muted-foreground">{t("salesByDay")}</h2>
        {total > 0 && (
          <p className="text-sm tabular-nums">
            <span className="font-semibold">{money(total)}</span>
            <span className="text-muted-foreground"> · {t("ordersInPeriod", { count: data.sales.ordersCount })}</span>
          </p>
        )}
      </div>
      {total === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("noSales")}</p>
      ) : (
        <figure className="flex flex-col gap-2" aria-label={t("salesByDay")}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3">
            <div className="relative h-40">
              {/* gridlines: top, middle, baseline */}
              {[0, 50, 100].map((pct) => (
                <span key={pct} aria-hidden className={cn("absolute inset-x-0 border-t", pct === 100 ? "border-foreground/25" : "border-border")} style={{ top: `${pct}%` }} />
              ))}
              <ol className="absolute inset-0 flex items-end gap-[2px]" dir="ltr">
                {days.map((d, i) => {
                  const h = top > 0 ? (d.paid_gross / top) * 100 : 0;
                  const isPeak = i === peakIndex && d.paid_gross > 0;
                  return (
                    <li key={d.day} className="group relative flex h-full max-w-6 flex-1 items-end">
                      <span className="sr-only">{`${dateFmt.format(new Date(d.day))}: ${money(d.paid_gross)}`}</span>
                      <span
                        aria-hidden
                        title={`${dateFmt.format(new Date(d.day))}: ${money(d.paid_gross)}`}
                        className={cn("block w-full rounded-t-[4px] transition-colors", d.paid_gross > 0 ? "bg-chart-1 group-hover:bg-primary" : "bg-chart-2")}
                        style={{ height: d.paid_gross > 0 ? `max(${h}%, 3px)` : "2px" }}
                      />
                      {isPeak && (
                        <span aria-hidden className="pointer-events-none absolute start-1/2 z-10 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-background tabular-nums" style={{ bottom: `calc(${h}% + 6px)` }}>
                          {money(d.paid_gross)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="relative h-40 w-12 text-[11px] text-muted-foreground tabular-nums" aria-hidden>
              <span className="absolute top-0 -translate-y-1/2">{compact(top)}</span>
              <span className="absolute top-1/2 -translate-y-1/2">{compact(top / 2)}</span>
              <span className="absolute top-full -translate-y-1/2">0</span>
            </div>
          </div>
          <div className="flex justify-between pe-15 text-[11px] text-muted-foreground" aria-hidden dir="ltr">
            {ticks.map((d) => (
              <span key={d.day}>{dateFmt.format(new Date(d.day))}</span>
            ))}
          </div>
        </figure>
      )}
    </section>
  );
}

export async function RecentOrders({ data, locale }: { data: Dashboard; locale: string }) {
  const t = await getTranslations("admin");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">{t("dashboard.recentOrders")}</h2>
        <Link href="/admin/orders" className="text-sm underline-offset-4 hover:underline">
          {t("dashboard.viewAll")}
        </Link>
      </div>
      {data.recentOrders.length === 0 ? (
        <EmptyState title={t("common.noResults")} className="py-8" />
      ) : (
        <ul className="divide-y">
          {data.recentOrders.map((o) => (
            <li key={o.id} className="flex min-w-0 items-center gap-3 py-2 text-sm">
              <Link href={`/admin/orders/${o.id}`} className="font-medium tabular-nums hover:underline" dir="ltr">
                {o.number}
              </Link>
              <span className="min-w-0 flex-1 truncate text-muted-foreground" dir="ltr">
                {o.email}
              </span>
              <span className="hidden text-muted-foreground sm:inline">{date.format(new Date(o.placed_at))}</span>
              <StatusBadge kind="order" value={o.status} />
              <span className="shrink-0 text-end tabular-nums">{formatMoney(o.total, o.currency, locale)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export async function LowStockList({ data }: { data: Dashboard }) {
  const t = await getTranslations("admin");
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">{t("dashboard.lowStock")}</h2>
        <Link href="/admin/inventory?low=1" className="text-sm underline-offset-4 hover:underline">
          {t("dashboard.viewAll")}
        </Link>
      </div>
      {data.lowStock.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("dashboard.stockHealthy")}</p>
      ) : (
        <ul className="divide-y">
          {data.lowStock.map((v) => (
            <li key={v.variant_id} className="flex min-w-0 items-center gap-3 py-2 text-sm">
              <Link href={`/admin/products/${v.product_id}`} className="min-w-0 flex-1 truncate hover:underline">
                {v.name}
              </Link>
              {v.sku && (
                <span className="hidden max-w-32 truncate text-xs text-muted-foreground sm:inline" dir="ltr">
                  {v.sku}
                </span>
              )}
              <StatusBadge kind="stock" value={v.stock_qty <= 0 ? "out" : "low"} />
              <span className="w-10 text-end tabular-nums">{v.stock_qty}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
