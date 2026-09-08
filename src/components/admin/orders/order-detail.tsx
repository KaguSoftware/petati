import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { OrderDetail as OrderDetailData } from "@/lib/admin/orders/queries";
import type { OrderAddress } from "@/lib/db/types";
import type { Locale } from "@/i18n/config";
import { pickJson } from "@/lib/catalog/types";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "../shared/status-badge";
import { InternalNoteForm } from "./internal-note-form";
import { OrderTimeline } from "./order-timeline";

function Address({ a }: { a: OrderAddress | null }) {
  if (!a) return <span className="text-muted-foreground">—</span>;
  return (
    <address className="text-sm not-italic">
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
  );
}

function Card({ title, children, className = "" }: { title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-3 rounded-xl border bg-card p-4 ${className}`}>
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

export async function OrderDetail({ order, storeId, locale }: { order: OrderDetailData; storeId: string; locale: Locale }) {
  const t = await getTranslations("admin");
  const tc = await getTranslations("cart");
  const money = (n: number) => formatMoney(n, order.currency, locale);
  const payment = order.payments[0];
  const shippingName = order.shipping_method ? pickJson(order.shipping_method.name, locale, order.locale) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-4">
        <Card title={t("orders.items")}>
          <ul className="divide-y">
            {order.order_items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-2 text-sm">
                {i.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.image_url} alt="" className="size-12 rounded-md border object-cover" />
                ) : (
                  <span className="size-12 rounded-md border bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {i.product_id ? (
                      <Link href={`/admin/products/${i.product_id}`} className="hover:underline">
                        {i.product_name}
                      </Link>
                    ) : (
                      i.product_name
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {i.variant_name ?? ""}
                    {i.sku ? ` · ${i.sku}` : ""}
                  </p>
                </div>
                <span className="text-muted-foreground tabular-nums">
                  {i.quantity} × {money(i.unit_price)}
                </span>
                <span className="w-24 text-end font-medium tabular-nums">{money(i.line_total)}</span>
              </li>
            ))}
          </ul>
          <dl className="ms-auto grid w-full max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
            <dt className="text-muted-foreground">{tc("subtotal")}</dt>
            <dd className="text-end tabular-nums">{money(order.subtotal)}</dd>
            {order.discount_total > 0 && (
              <>
                <dt className="text-muted-foreground">
                  {tc("discount")}
                  {order.coupon_code ? ` (${order.coupon_code})` : ""}
                </dt>
                <dd className="text-end tabular-nums">−{money(order.discount_total)}</dd>
              </>
            )}
            <dt className="text-muted-foreground">
              {tc("shipping")}
              {shippingName ? ` · ${shippingName}` : ""}
            </dt>
            <dd className="text-end tabular-nums">{money(order.shipping_total)}</dd>
            <dt className="text-muted-foreground">{tc("tax")}</dt>
            <dd className="text-end tabular-nums">{money(order.tax_total)}</dd>
            <dt className="border-t pt-1 font-medium">{tc("total")}</dt>
            <dd className="border-t pt-1 text-end font-semibold tabular-nums">{money(order.total)}</dd>
            {order.refunded_total > 0 && (
              <>
                <dt className="text-destructive">{t("orders.refunded")}</dt>
                <dd className="text-end text-destructive tabular-nums">−{money(order.refunded_total)}</dd>
              </>
            )}
          </dl>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card title={t("orders.shippingAddress")}>
            <Address a={order.shipping_address} />
          </Card>
          <Card title={t("orders.billingAddress")}>
            <Address a={order.billing_address} />
          </Card>
        </div>

        {order.customer_note && (
          <Card title={t("orders.note.customer")}>
            <p className="text-sm whitespace-pre-wrap">{order.customer_note}</p>
          </Card>
        )}
        <Card title={t("orders.note.internal")}>
          <InternalNoteForm storeId={storeId} orderId={order.id} note={order.internal_note} />
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card title={t("orders.customer")}>
          <div className="flex flex-col gap-1 text-sm">
            {order.customers ? (
              <Link href={`/admin/customers/${order.customers.id}`} className="font-medium hover:underline">
                {order.customers.full_name ?? order.email}
              </Link>
            ) : (
              <span className="font-medium">{order.shipping_address?.full_name ?? "—"}</span>
            )}
            <span dir="ltr" className="text-muted-foreground">
              {order.email}
            </span>
            {order.phone && (
              <span dir="ltr" className="text-muted-foreground">
                {order.phone}
              </span>
            )}
          </div>
        </Card>
        <Card title={t("orders.payment")}>
          {payment ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">{t("common.status")}</dt>
              <dd>
                <StatusBadge kind="payment" value={payment.status} />
              </dd>
              <dt className="text-muted-foreground">{t("orders.provider")}</dt>
              <dd className="capitalize">{payment.provider}</dd>
              {payment.provider_ref && (
                <>
                  <dt className="text-muted-foreground">{t("orders.paymentRef")}</dt>
                  <dd dir="ltr" className="truncate">
                    {payment.provider_ref}
                  </dd>
                </>
              )}
            </dl>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
          {order.refunds.length > 0 && (
            <ul className="flex flex-col gap-1 border-t pt-2 text-sm">
              {order.refunds.map((r) => (
                <li key={r.id} className="flex justify-between gap-2">
                  <span className="truncate text-muted-foreground">{r.reason ?? t("orders.refunded")}</span>
                  <span className="tabular-nums">−{money(r.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {(order.tracking_number || order.tracking_url) && (
          <Card title={t("orders.ship.title")}>
            <p className="text-sm" dir="ltr">
              {order.tracking_url ? (
                <a href={order.tracking_url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  {order.tracking_number ?? order.tracking_url}
                </a>
              ) : (
                order.tracking_number
              )}
            </p>
          </Card>
        )}
        <Card title={t("orders.timeline.title")}>
          <OrderTimeline events={order.order_events} locale={locale} currency={order.currency} />
        </Card>
      </div>
    </div>
  );
}
