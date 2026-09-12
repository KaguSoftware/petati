import { getTranslations } from "next-intl/server";
import type { DeliveryStats } from "@/lib/admin/delivery/queries";
import { formatMoney } from "@/lib/money";
import { EntityLink } from "../shared/entity-link";
import { dateTimeFormat } from "@/lib/number";

/** 1-2-5 rounding so the axis lands on a readable number (same helper idea as the sales chart). */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 5, 10]) {
    if (value <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

/**
 * Thirty days of deliveries: the shape of the work, and the number that makes the کد تحویل worth
 * having — how often stops are actually closed with the customer's code rather than waved through.
 */
export async function DeliveryStatsPanel({ stats, locale, currency }: { stats: DeliveryStats; locale: string; currency: string }) {
  const t = await getTranslations("admin.delivery.stats");
  const dateFmt = dateTimeFormat(locale, { day: "numeric", month: "short" });
  const peak = Math.max(1, ...stats.days.map((d) => d.delivered + d.failed));
  const top = niceMax(peak);
  const verifiedPct = stats.delivered > 0 ? Math.round((stats.verified / stats.delivered) * 100) : null;
  const ticks = [stats.days[0], stats.days[Math.floor(stats.days.length / 2)], stats.days.at(-1)].filter(Boolean);

  if (stats.delivered === 0 && stats.failed === 0) {
    return (
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-medium text-muted-foreground">{t("title")}</h2>
        <p className="py-6 text-center text-sm text-muted-foreground">{t("none")}</p>
      </section>
    );
  }

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-medium text-muted-foreground">{t("title")}</h2>
        <p className="flex flex-wrap gap-x-4 text-sm">
          <span>
            {t("delivered")}: <span className="font-semibold tabular-nums">{stats.delivered}</span>
          </span>
          <span className="text-muted-foreground">
            {t("failed")}: <span className="tabular-nums">{stats.failed}</span>
          </span>
          {verifiedPct !== null && (
            <span className="text-muted-foreground">
              {t("verifiedRate")}: <span className="font-medium text-foreground tabular-nums">{verifiedPct}%</span>
            </span>
          )}
          {stats.avgHours !== null && (
            <span className="text-muted-foreground">
              {t("avgHours")}: <span className="tabular-nums">{t("hours", { count: Math.round(stats.avgHours) })}</span>
            </span>
          )}
        </p>
      </div>

      <div className="flex items-end gap-px" style={{ height: "6rem" }}>
        {stats.days.map((d) => {
          const total = d.delivered + d.failed;
          return (
            <span
              key={d.day}
              className="group relative flex flex-1 flex-col justify-end"
              title={`${dateFmt.format(new Date(d.day))} · ${d.delivered} / ${d.failed}`}
              style={{ height: "100%" }}
            >
              <span className="w-full bg-destructive/50" style={{ height: `${(d.failed / top) * 100}%` }} />
              <span className="w-full bg-[var(--chart-1)] transition-colors group-hover:bg-primary" style={{ height: `${(d.delivered / top) * 100}%` }} />
              <span className="sr-only">
                {dateFmt.format(new Date(d.day))}: {d.delivered}, {d.failed}
              </span>
              {total === 0 && <span className="w-full bg-muted" style={{ height: "1px" }} />}
            </span>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        {ticks.map((d) => (
          <span key={d!.day}>{dateFmt.format(new Date(d!.day))}</span>
        ))}
      </div>

      {stats.couriers.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase">
              <th className="py-1 text-start font-medium">{t("league")}</th>
              <th className="py-1 text-end font-medium">{t("stops")}</th>
              <th className="py-1 text-end font-medium">{t("delivered")}</th>
              <th className="py-1 text-end font-medium">{t("verifiedRate")}</th>
              <th className="py-1 text-end font-medium">{t("failed")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stats.couriers.map((c) => (
              <tr key={c.courier_id} className="hover:bg-muted/40">
                <td className="py-1.5">
                  <EntityLink kind="courier" id={c.courier_id} label={c.name} />
                </td>
                <td className="py-1.5 text-end tabular-nums">{c.stops}</td>
                <td className="py-1.5 text-end tabular-nums">{c.delivered}</td>
                <td className="py-1.5 text-end tabular-nums">{c.delivered > 0 ? `${Math.round((c.verified / c.delivered) * 100)}%` : "—"}</td>
                <td className="py-1.5 text-end tabular-nums">{c.failed}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-xs text-muted-foreground">
              <td colSpan={5} className="pt-2 text-end">
                {formatMoney(stats.couriers.reduce((s, c) => s + c.cash, 0), currency, locale)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );
}
