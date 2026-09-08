import { AlertTriangle, Boxes, Star, TrendingUp, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Dashboard } from "@/lib/admin/dashboard/queries";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "../shared/empty-state";
import { KpiCard } from "../shared/kpi-card";
import { StatusBadge } from "../shared/status-badge";

export async function KpiGrid({ data, locale }: { data: Dashboard; locale: string }) {
  const t = await getTranslations("admin.dashboard");
  const money = (n: number) => formatMoney(n, data.currency, locale);
  const num = new Intl.NumberFormat(locale);
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {data.sales && <KpiCard label={t("revenue30d")} value={money(data.sales.paidGross - data.sales.refunds)} hint={t("ordersInPeriod", { count: data.sales.ordersCount })} icon={TrendingUp} />}
      {data.sales && <KpiCard label={t("margin30d")} value={money(data.sales.paidGross - data.sales.refunds - data.sales.cogs)} hint={t("afterCogs")} icon={Wallet} />}
      <KpiCard label={t("pendingPayment")} value={num.format(data.pendingPayment)} icon={AlertTriangle} tone={data.pendingPayment > 0 ? "warning" : "default"} />
      <KpiCard label={t("pendingReviews")} value={num.format(data.pendingReviews)} icon={Star} />
      <KpiCard label={t("lowStock")} value={num.format(data.lowStockCount)} icon={Boxes} tone={data.lowStockCount > 0 ? "warning" : "default"} />
    </div>
  );
}

export async function SalesBars({ data, locale }: { data: Dashboard; locale: string }) {
  const t = await getTranslations("admin.dashboard");
  if (!data.sales) return null;
  const max = Math.max(1, ...data.sales.days.map((d) => d.paid_gross));
  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-medium text-muted-foreground">{t("salesByDay")}</h2>
      {data.sales.days.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noSales")}</p>
      ) : (
        <ol className="flex h-32 items-end gap-1" aria-label={t("salesByDay")}>
          {data.sales.days.map((d) => (
            <li key={d.day} className="group relative flex h-full max-w-10 flex-1 items-end" title={`${fmt.format(new Date(d.day))}: ${formatMoney(d.paid_gross, data.currency, locale)}`}>
              <span className="w-full rounded-t-sm bg-primary/60 transition-colors group-hover:bg-primary" style={{ height: `${Math.max(2, (d.paid_gross / max) * 100)}%` }} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export async function RecentOrders({ data, locale }: { data: Dashboard; locale: string }) {
  const t = await getTranslations("admin");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
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
            <li key={o.id} className="flex items-center gap-3 py-2 text-sm">
              <Link href={`/admin/orders/${o.id}`} className="font-medium tabular-nums hover:underline" dir="ltr">
                {o.number}
              </Link>
              <span className="min-w-0 flex-1 truncate text-muted-foreground" dir="ltr">
                {o.email}
              </span>
              <span className="hidden text-muted-foreground sm:inline">{date.format(new Date(o.placed_at))}</span>
              <StatusBadge kind="order" value={o.status} />
              <span className="w-24 text-end tabular-nums">{formatMoney(o.total, o.currency, locale)}</span>
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
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
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
            <li key={v.variant_id} className="flex items-center gap-3 py-2 text-sm">
              <Link href={`/admin/products/${v.product_id}`} className="min-w-0 flex-1 truncate hover:underline">
                {v.name}
              </Link>
              {v.sku && (
                <span className="text-xs text-muted-foreground" dir="ltr">
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
