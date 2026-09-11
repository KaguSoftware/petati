import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PrintButton } from "@/components/storefront/shared/print-button";
import { RunStops } from "@/components/admin/delivery/run-stops";
import { requireAdminPage } from "@/lib/admin/context";
import { getCourier, listRun, storeToday } from "@/lib/admin/delivery/queries";
import { deliveryFromSettings, slotLabel } from "@/lib/delivery/settings";
import { can } from "@/lib/auth/permissions";
import { formatMoney } from "@/lib/money";
import { stringParam, type SearchParams } from "@/lib/admin/list-params";

type Props = PageProps<"/[locale]/admin/delivery/runs/[courierId]">;

export default function RunPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">…</p>}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * One courier's day on paper and on screen. The delivery CODE is deliberately never printed — that
 * is the customer's half of the handover; the sheet leaves a box for the courier to write it into,
 * which is what makes a paper run compatible with the code flow.
 */
async function Content({ params, searchParams }: { params: Props["params"]; searchParams: Props["searchParams"] }) {
  const { locale, courierId } = await params;
  setRequestLocale(locale);
  const ctx = await requireAdminPage(locale, "delivery.read");
  const sp = (await searchParams) as SearchParams;
  const day = stringParam(sp, "d", 10) ?? storeToday(ctx.store.timezone);

  const [courier, stops, t] = await Promise.all([getCourier(ctx.store.id, courierId), listRun(ctx.store.id, courierId, day), getTranslations("admin.delivery")]);
  if (!courier) notFound();
  const settings = deliveryFromSettings(ctx.store.settings);
  const money = (n: number) => formatMoney(n, ctx.store.currency, ctx.locale);
  const cashTotal = stops.reduce((s, r) => s + r.cash_expected, 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-xl border bg-card p-6 print:max-w-none print:rounded-none print:border-0 print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div>
          <p className="text-sm text-muted-foreground">{ctx.store.name}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{courier.name}</h1>
          <p className="text-sm text-muted-foreground tabular-nums">
            {new Intl.DateTimeFormat(ctx.locale, { dateStyle: "full" }).format(new Date(day))} · {t("run.stops", { count: stops.length })}
            {cashTotal > 0 ? ` · ${money(cashTotal)}` : ""}
          </p>
        </div>
        <PrintButton label={t("run.print")} />
      </header>

      <RunStops
        storeId={ctx.store.id}
        canReorder={can(ctx.role, "delivery.assign")}
        stops={stops.map((s, i) => ({
          id: s.id,
          index: i + 1,
          orderNumber: s.order_number,
          customer: s.customer_name,
          phone: s.phone,
          address: s.address ? [s.address.line1, s.address.line2, s.address.postal_code, s.address.city].filter(Boolean).join(", ") : null,
          slot: s.slot ? slotLabel(settings.slots.find((x) => x.key === s.slot) ?? { key: s.slot, label: {}, from: "", to: "" }, ctx.locale, ctx.locale) : null,
          cash: s.cash_expected > 0 ? money(s.cash_expected) : null,
          state: s.state,
        }))}
        labels={{ moveUp: t("run.moveUp"), moveDown: t("run.moveDown"), codeBox: t("run.codeBox") }}
      />

      <p className="border-t pt-3 text-center text-xs text-muted-foreground">{t("run.instruction")}</p>
    </div>
  );
}
