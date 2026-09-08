import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Price } from "@/components/storefront/shared/price";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CartViewProps } from "../types";

export function CartViewPlayful({ cart, totals, currency, locale, labels, lineControls, couponSlot, checkoutHref, shopHref }: CartViewProps) {
  const money = (n: number) => formatMoney(n, currency, locale);
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">{labels.title}</h1>
      {cart.lines.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-muted px-6 py-16 text-center ring-1 ring-foreground/5">
          <p className="text-lg text-muted-foreground">{labels.empty}</p>
          <Link href={shopHref} className={buttonVariants({ size: "lg", className: "h-11 rounded-full px-6" })}>
            {labels.continueShopping}
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="flex flex-col gap-4">
            {cart.lines.map((l) => (
              <li key={l.id} className="flex gap-4 rounded-2xl bg-muted/50 p-4 ring-1 ring-foreground/5">
                <Link href={`/p/${l.productSlug}`} className="shrink-0">
                  <ProductImage src={l.imageUrl} alt={l.name} className="size-24 rounded-2xl" sizes="96px" />
                </Link>
                <div className="flex flex-1 flex-col gap-1">
                  <Link href={`/p/${l.productSlug}`} className="font-semibold hover:underline">
                    {l.name}
                  </Link>
                  {l.variantLabel && <p className="text-sm text-muted-foreground">{l.variantLabel}</p>}
                  <div className="mt-auto flex items-center justify-between gap-3">
                    {lineControls[l.id]}
                    <Price amount={l.lineTotal} currency={currency} locale={locale} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <aside className="flex h-fit flex-col gap-4 rounded-3xl bg-primary/5 p-6 ring-1 ring-foreground/5">
            {couponSlot}
            <dl className="flex flex-col gap-2 text-sm">
              <Row label={labels.subtotal} value={money(totals.subtotal)} />
              {totals.discount > 0 && <Row label={labels.discount} value={`−${money(totals.discount)}`} />}
              <Row label={labels.shipping} value={totals.shipping === 0 ? labels.freeShipping : money(totals.shipping)} />
              {labels.shippingNote && <p className="text-xs text-muted-foreground">{labels.shippingNote}</p>}
              {totals.tax > 0 && <Row label={labels.tax} value={money(totals.tax)} muted />}
              <div className="my-1 border-t border-foreground/10" />
              <Row label={labels.total} value={money(totals.total)} strong />
            </dl>
            <Link href={checkoutHref} className={buttonVariants({ size: "lg", className: "h-12 rounded-full text-base shadow-lg shadow-primary/20" })}>
              {labels.checkout}
            </Link>
            <Link href={shopHref} className="rounded-full py-1 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground">
              {labels.continueShopping}
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4", strong && "text-lg font-bold", muted && "text-muted-foreground")}>
      <dt>{label}</dt>
      <dd className="text-end tabular-nums">{value}</dd>
    </div>
  );
}
