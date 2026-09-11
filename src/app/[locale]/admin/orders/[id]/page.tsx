import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrderActions } from "@/components/admin/orders/order-actions";
import { OrderDetail } from "@/components/admin/orders/order-detail";
import { PageHeader } from "@/components/admin/shared/page-header";
import { OptimisticStatusBadge } from "@/components/admin/shared/optimistic-status-badge";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { requireAdminPage } from "@/lib/admin/context";
import { getOrder } from "@/lib/admin/orders/queries";
import { listDeliveriesForOrder } from "@/lib/admin/delivery/queries";
import { signedProofUrl } from "@/lib/courier/photo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { OrderDeliveryCard } from "@/components/admin/orders/order-delivery-card";
import { can } from "@/lib/auth/permissions";

type Props = PageProps<"/[locale]/admin/orders/[id]">;

/** `[id]` has no static params, so the params read itself is runtime data: keep it under Suspense. */
export default function OrderPage({ params }: Props) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Props["params"] }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const ctx = await requireAdminPage(locale, "orders.read");
  const [order, deliveries, t] = await Promise.all([getOrder(ctx.store.id, id), listDeliveriesForOrder(ctx.store.id, id), getTranslations("admin")]);
  if (!order) notFound();
  // Proof photos live in a private bucket: hand the card short-lived signed URLs, never paths.
  const photoUrls: Record<string, string> = {};
  if (deliveries.some((d) => d.photo_url)) {
    const db = createSupabaseAdminClient();
    for (const d of deliveries) {
      if (!d.photo_url) continue;
      const url = await signedProofUrl(db, d.photo_url);
      if (url) photoUrls[d.id] = url;
    }
  }
  const date = new Intl.DateTimeFormat(ctx.locale, { dateStyle: "long", timeStyle: "short" });
  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: t("nav.orders") }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span dir="ltr">{order.number}</span>
            <OptimisticStatusBadge id={order.id} kind="order" value={order.status} className="text-sm" />
          </span>
        }
        description={date.format(new Date(order.placed_at))}
        actions={
          can(ctx.role, "orders.update") ? (
            <OrderActions
              storeId={ctx.store.id}
              orderId={order.id}
              status={order.status}
              currency={order.currency}
              locale={ctx.locale}
              remainingRefundable={order.total - order.refunded_total}
              canRefund={can(ctx.role, "orders.refund")}
              shippingCost={order.shipping_cost ?? 0}
            />
          ) : null
        }
      />
      <OrderDetail
        order={order}
        storeId={ctx.store.id}
        locale={ctx.locale}
        delivery={
          deliveries.length > 0 ? (
            <OrderDeliveryCard
              storeId={ctx.store.id}
              attempts={deliveries}
              locale={ctx.locale}
              currency={order.currency}
              canAssign={can(ctx.role, "delivery.assign")}
              photoUrls={photoUrls}
            />
          ) : null
        }
      />
    </>
  );
}
