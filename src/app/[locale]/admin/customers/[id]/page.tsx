import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Receipt, ShoppingBag, Clock } from "lucide-react";
import { AddressCards } from "@/components/admin/customers/address-cards";
import { CustomerDeliveryCard } from "@/components/admin/customers/customer-delivery-card";
import { CustomerForm } from "@/components/admin/customers/customer-form";
import { OrdersTable } from "@/components/admin/orders/orders-table";
import { CrumbLabel } from "@/components/admin/shared/crumb-label";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { requireAdminPage } from "@/lib/admin/context";
import { getCustomer, getCustomerDeliverySummary } from "@/lib/admin/customers/queries";
import { currentQuery, parseListParams, type SearchParams } from "@/lib/admin/list-params";
import { listOrders, ORDER_SORTS } from "@/lib/admin/orders/queries";
import { can } from "@/lib/auth/permissions";
import { formatMoney } from "@/lib/money";

type Props = PageProps<"/[locale]/admin/customers/[id]">;

/** `[id]` has no static params, so the params read itself is runtime data: keep it under Suspense. */
export default function CustomerPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

async function Content({ params, searchParams }: { params: Props["params"]; searchParams: Props["searchParams"] }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const ctx = await requireAdminPage(locale, "customers.read");
  const sp = (await searchParams) as SearchParams;
  const list = parseListParams(sp, { sorts: ORDER_SORTS, defaultSort: "placed_at", pageSize: 10 });
  const canDelivery = can(ctx.role, "delivery.read");
  const [customer, t, tc] = await Promise.all([getCustomer(ctx.store.id, id), getTranslations("admin"), getTranslations("common")]);
  if (!customer) notFound();
  const [{ rows, total }, delivery] = await Promise.all([
    listOrders(ctx.store.id, { ...list, customerId: customer.id }),
    canDelivery ? getCustomerDeliverySummary(ctx.store.id, customer.id) : Promise.resolve(null),
  ]);
  const date = new Intl.DateTimeFormat(ctx.locale, { dateStyle: "medium" });
  const num = new Intl.NumberFormat(ctx.locale);
  const query = currentQuery(sp, ["sort", "dir"]);
  const basePath = `/admin/customers/${customer.id}`;
  const name = customer.full_name ?? customer.email;

  return (
    <>
      <CrumbLabel segment={customer.id} label={name} />
      <PageHeader
        back={{ href: "/admin/customers", label: t("nav.customers") }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span>{name}</span>
            <Badge variant="outline" className="text-sm font-normal">
              {customer.user_id ? t("customers.account") : t("customers.guest")}
            </Badge>
          </span>
        }
        description={
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <span dir="ltr">{customer.email}</span>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} dir="ltr" className="hover:underline">
                {customer.phone}
              </a>
            )}
            <span>
              {t("customers.joined")}: {date.format(new Date(customer.created_at))}
            </span>
          </span>
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3">
        <KpiCard label={t("customers.orders")} value={num.format(customer.orders_count)} icon={ShoppingBag} href="#orders" />
        <KpiCard label={t("customers.spent")} value={formatMoney(customer.total_spent, ctx.store.currency, ctx.locale)} icon={Receipt} />
        <KpiCard label={t("customers.lastOrder")} value={customer.last_order_at ? date.format(new Date(customer.last_order_at)) : t("customers.never")} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <Card title={t("customers.details")}>
          {/* keyed on updated_at so the uncontrolled inputs remount with fresh defaults after a save + refresh */}
          <CustomerForm key={customer.updated_at} storeId={ctx.store.id} customer={customer} readOnly={!can(ctx.role, "customers.write")} />
        </Card>
        <div className="flex flex-col gap-4">
          <Card title={t("customers.addresses")}>
            <AddressCards addresses={customer.addresses} />
          </Card>
          {delivery && (
            <Card title={t("customers.delivery.title")}>
              <CustomerDeliveryCard summary={delivery} currency={ctx.store.currency} locale={ctx.locale} customerId={customer.id} />
            </Card>
          )}
        </div>
      </div>

      <section id="orders" className="flex scroll-mt-20 flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">{t("customers.ordersTitle")}</h2>
        <OrdersTable rows={rows} locale={ctx.locale} sort={{ sort: list.sort, dir: list.dir }} query={query} basePath={basePath} hideCustomer />
        <Pagination page={list.page} pageSize={list.pageSize} total={total} basePath={basePath} query={query} labels={{ prev: tc("previous"), next: tc("next") }} />
      </section>
      {/* SCOPE(customers): no delete/merge; GROWS LATER → GDPR export/delete */}
    </>
  );
}
