import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PrintButton } from "@/components/storefront/shared/print-button";
import { requireAdminPage } from "@/lib/admin/context";
import { getOrder } from "@/lib/admin/orders/queries";
import { env } from "@/lib/env";
import { formatMoney } from "@/lib/money";

type Props = PageProps<"/[locale]/admin/orders/[id]/slip">;

/**
 * The paper that travels with the parcel. It carries the order number and the address for the
 * courier and the /deliver link they confirm on — and deliberately NOT the delivery code, which is
 * the customer's half of the handover.
 */
export default function SlipPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">…</p>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Props["params"] }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const ctx = await requireAdminPage(locale, "orders.read");
  const [order, t] = await Promise.all([getOrder(ctx.store.id, id), getTranslations("admin.orders")]);
  if (!order) notFound();
  const a = order.shipping_address;
  const money = (n: number) => formatMoney(n, order.currency, ctx.locale);
  const deliverUrl = `${env.appUrl()}/${order.locale}/deliver?o=${encodeURIComponent(order.number)}`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 rounded-xl border bg-card p-6 print:max-w-none print:rounded-none print:border-0 print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div>
          <p className="text-sm text-muted-foreground">{ctx.store.name}</p>
          <h1 className="text-2xl font-semibold tracking-tight" dir="ltr">
            {order.number}
          </h1>
        </div>
        <PrintButton label={t("slip.print")} />
      </header>

      {a && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-muted-foreground">{t("shippingAddress")}</h2>
          <address className="text-base not-italic">
            {a.full_name}
            <br />
            {a.line1}
            {a.line2 ? (
              <>
                <br />
                {a.line2}
              </>
            ) : null}
            <br />
            {a.postal_code} {a.city}
            {a.region ? `, ${a.region}` : ""}
            <br />
            {a.country}
            {a.phone ? (
              <>
                <br />
                <span dir="ltr">{a.phone}</span>
              </>
            ) : null}
          </address>
        </section>
      )}

      <section>
        <h2 className="mb-1 text-sm font-medium text-muted-foreground">{t("items")}</h2>
        <ul className="divide-y text-sm">
          {order.order_items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-1.5">
              <span>
                {i.product_name}
                {i.variant_name ? ` · ${i.variant_name}` : ""} × {i.quantity}
              </span>
              <span className="tabular-nums">{money(i.line_total)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex justify-between border-t pt-2 font-semibold">
          <span>{t("total")}</span>
          <span className="tabular-nums">{money(order.total)}</span>
        </p>
      </section>

      {/* SCOPE(delivery-slip): the confirm address is printed as text. GROWS LATER → a scannable QR
          (needs a QR encoder dependency) so the courier does not type the URL. */}
      <section className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-sm font-medium">{t("slip.instruction")}</p>
        <p dir="ltr" className="mt-1 text-sm break-all text-muted-foreground">
          {deliverUrl}
        </p>
      </section>
    </div>
  );
}
