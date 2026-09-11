import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { DeliverySettlementRow } from "@/lib/db/types";
import { formatMoney } from "@/lib/money";
import { EntityLink } from "../shared/entity-link";

type Row = DeliverySettlementRow & { courier_name: string | null; settled_by_name?: string | null };

/** Recent handovers. Each line links to the courier and to the log entries the settlement wrote. */
export async function SettlementsList({ rows, currency, locale, hideCourier }: { rows: Row[]; currency: string; locale: string; hideCourier?: boolean }) {
  const t = await getTranslations("admin.delivery.cash");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-medium text-muted-foreground">{t("history")}</h2>
      <ul className="divide-y text-sm">
        {rows.map((s) => (
          <li key={s.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
            {!hideCourier && (s.courier_name ? <EntityLink kind="courier" id={s.courier_id} label={s.courier_name} /> : <span>—</span>)}
            <span className="text-xs text-muted-foreground tabular-nums">{date.format(new Date(s.created_at))}</span>
            <Link href={`/admin/delivery/log?courier=${s.courier_id}&type=settled`} className="text-xs text-muted-foreground underline-offset-4 hover:underline">
              {t("stops", { count: s.deliveries_count })}
            </Link>
            {s.settled_by_name && <span className="text-xs text-muted-foreground">{t("by", { name: s.settled_by_name })}</span>}
            <span className="ms-auto font-medium tabular-nums">{formatMoney(s.amount, s.currency || currency, locale)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
