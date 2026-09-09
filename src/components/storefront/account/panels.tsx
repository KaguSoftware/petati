import { Heart, PackageOpen } from "lucide-react";
import { EmptyState } from "@/components/storefront/shared/empty-state";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
import type { StoreContext } from "@/lib/tenant/context";
import type { SessionUser } from "@/lib/auth/session";
import type { AddressRow, OrderRow } from "@/lib/db/types";
import type { ProductCardData } from "@/lib/catalog/types";
import { formatMoney } from "@/lib/money";
import { defaultCountryForLocale } from "@/lib/phone/countries";
import { splitPhone } from "@/lib/phone/normalize";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ProductGridWithWishlist } from "@/components/storefront/product-grid-with-wishlist";
import { AddressList } from "./address-form";
import { PasswordForm, ProfileForm } from "./profile-forms";

/**
 * The four account sections as server components. The account layout renders ALL of them up
 * front (one query wave) and the client shell switches between them without a navigation, so
 * moving between sections costs zero requests (the same rule the admin follows).
 */

const heading = "text-xl font-semibold tracking-tight @tablet:text-2xl";

export async function OrdersPanel({ orders, locale }: { orders: Pick<OrderRow, "id" | "number" | "placed_at" | "status" | "total" | "currency">[]; locale: Locale }) {
  const [t, ts, tn] = await Promise.all([getTranslations("account"), getTranslations("orderStatus"), getTranslations("nav")]);
  return (
    <div className="flex flex-col gap-4">
      <h2 className={heading}>{t("orders")}</h2>
      {orders.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={t("noOrdersTitle")}
          description={t("noOrders")}
          action={
            <Link href="/shop" className={buttonVariants({ size: "xl" })}>
              {tn("shop")}
            </Link>
          }
        />
      ) : (
        <ul className="divide-y rounded-xl border">
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

export async function AddressesPanel({ ctx, addresses }: { ctx: StoreContext; addresses: AddressRow[] }) {
  const t = await getTranslations("account");
  return (
    <div className="flex flex-col gap-4">
      <h2 className={heading}>{t("addresses")}</h2>
      <AddressList storeSlug={ctx.store.slug} addresses={addresses} defaultCountry={(ctx.store.settings.default_country as string | undefined) ?? "TR"} />
    </div>
  );
}

export async function WishlistPanel({ ctx, products }: { ctx: StoreContext; products: ProductCardData[] }) {
  const [t, tn] = await Promise.all([getTranslations("account"), getTranslations("nav")]);
  return (
    <div className="flex flex-col gap-4">
      <h2 className={heading}>{t("wishlist")}</h2>
      {products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t("wishlistEmptyTitle")}
          description={t("wishlistEmpty")}
          action={
            <Link href="/shop" className={buttonVariants({ size: "xl" })}>
              {tn("shop")}
            </Link>
          }
        />
      ) : (
        <ProductGridWithWishlist ctx={ctx} products={products} bare emptyLabel="" />
      )}
    </div>
  );
}

export async function ProfilePanel({ user, locale }: { user: SessionUser; locale: Locale }) {
  const t = await getTranslations("account");
  const phone = splitPhone(user.profile.phone, user.profile.phone_country ?? defaultCountryForLocale(locale));
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className={heading}>{t("profile")}</h2>
        <ProfileForm fullName={user.profile.full_name ?? ""} email={user.email ?? ""} phone={phone} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className={heading}>{t("password")}</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
