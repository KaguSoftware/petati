import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PrintButton } from "@/components/storefront/shared/print-button";
import { AutoPrint } from "@/components/admin/delivery/auto-print";
import { DayNav } from "@/components/admin/delivery/day-nav";
import { RunStops } from "@/components/admin/delivery/run-stops";
import { CrumbLabel } from "@/components/admin/shared/crumb-label";
import { EntityLink } from "@/components/admin/shared/entity-link";
import { PageHeader } from "@/components/admin/shared/page-header";
import { requireAdminPage } from "@/lib/admin/context";
import { getCourier, listRun, storeToday } from "@/lib/admin/delivery/queries";
import { deliveryFromSettings, slotLabel } from "@/lib/delivery/settings";
import { can } from "@/lib/auth/permissions";
import { formatMoney } from "@/lib/money";
import { stringParam, type SearchParams } from "@/lib/admin/list-params";
import { dateTimeFormat } from "@/lib/number";

type Props = PageProps<"/[locale]/admin/delivery/runs/[courierId]">;

export default function RunPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">…</p>}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

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
  const today = storeToday(ctx.store.timezone);
  const raw = stringParam(sp, "d", 10);
  const day = raw && ISO.test(raw) ? raw : today;
  const autoPrint = stringParam(sp, "print", 1) === "1";

  const [courier, stops, t] = await Promise.all([getCourier(ctx.store.id, courierId), listRun(ctx.store.id, courierId, day), getTranslations("admin.delivery")]);
  if (!courier) notFound();
  const settings = deliveryFromSettings(ctx.store.settings);
  const money = (n: number) => formatMoney(n, ctx.store.currency, ctx.locale);
  const cashTotal = stops.reduce((s, r) => s + r.cash_expected, 0);

  return (
    <>
      <CrumbLabel segment={courier.id} label={courier.name} />
      {autoPrint && <AutoPrint />}
      <PageHeader className="print:hidden" back={{ href: `/admin/delivery/couriers/${courier.id}`, label: courier.name }} title={t("run.title")} actions={<PrintButton label={t("run.print")} />} />
      <DayNav day={day} today={today} basePath={`/admin/delivery/runs/${courier.id}`} locale={ctx.locale} className="-mt-3" />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-xl border bg-card p-6 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
          <div>
            <p className="text-sm text-muted-foreground">{ctx.store.name}</p>
            <h2 className="text-2xl font-semibold tracking-tight">
              <span className="print:hidden">
                <EntityLink kind="courier" id={courier.id} label={courier.name} className="font-semibold" />
              </span>
              <span className="hidden print:inline">{courier.name}</span>
            </h2>
            <p className="text-sm text-muted-foreground tabular-nums">
              {dateTimeFormat(ctx.locale, { dateStyle: "full" }).format(new Date(`${day}T12:00:00`))} · {t("run.stops", { count: stops.length })}
              {cashTotal > 0 ? ` · ${money(cashTotal)}` : ""}
            </p>
            {courier.phone && (
              <p className="hidden text-sm text-muted-foreground print:block" dir="ltr">
                {courier.phone}
              </p>
            )}
          </div>
        </header>

        <RunStops
          storeId={ctx.store.id}
          canReorder={can(ctx.role, "delivery.assign")}
          stops={stops.map((s, i) => ({
            id: s.id,
            index: i + 1,
            orderId: s.order_id,
            orderNumber: s.order_number,
            customer: s.customer_name,
            phone: s.phone,
            address: s.address ? [s.address.line1, s.address.line2, s.address.postal_code, s.address.city].filter(Boolean).join(", ") : null,
            slot: s.slot ? slotLabel(settings.slots.find((x) => x.key === s.slot) ?? { key: s.slot, label: {}, from: "", to: "" }, ctx.locale, ctx.locale) : null,
            cash: s.cash_expected > 0 ? money(s.cash_expected) : null,
            state: s.state,
          }))}
          labels={{ moveUp: t("run.moveUp"), moveDown: t("run.moveDown"), codeBox: t("run.codeBox"), empty: t("run.empty") }}
        />

        <p className="border-t pt-3 text-center text-xs text-muted-foreground">{t("run.instruction")}</p>
      </div>
    </>
  );
}
