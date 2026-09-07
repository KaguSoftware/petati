import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { storeContext } from "@/lib/tenant/context";
import { getMyOrders } from "@/lib/account/queries";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";

export default async function AccountOrdersPage({ params }: PageProps<"/[locale]/s/[store]/account">) {
  const { store, locale } = await storeContext(params);
  const [t, ts, orders] = await Promise.all([getTranslations("account"), getTranslations("orderStatus"), getMyOrders(store.id)]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{t("orders")}</h2>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">{t("noOrders")}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/order/${o.id}`} className="flex items-center justify-between gap-3 p-4 text-sm hover:bg-muted/50">
                <div>
                  <p className="font-medium">{o.number}</p>
                  <p className="text-muted-foreground">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(o.placed_at))}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{ts(o.status)}</Badge>
                  <span className="tabular-nums">{formatMoney(o.total, o.currency, locale)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
