import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Price } from "@/components/storefront/shared/price";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CartViewProps } from "../types";

const textLink = "text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground";

export function CartViewEditorial({ cart, totals, currency, locale, labels, lineControls, couponSlot, checkoutHref, shopHref }: CartViewProps) {
  const money = (n: number) => formatMoney(n, currency, locale);
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-10 border-b border-foreground/15 pb-4 font-serif text-4xl font-medium tracking-tight md:text-5xl">{labels.title}</h1>
      {cart.lines.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-20 text-center">
          <p className="font-serif text-lg italic text-muted-foreground">{labels.empty}</p>
          <Link href={shopHref} className={cn(textLink, "border-b border-foreground pb-1 text-foreground hover:border-primary hover:text-primary")}>
            {labels.continueShopping}
          </Link>
        </div>
      ) : (
        <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
          <ul className="divide-y divide-foreground/15 border-b border-foreground/15">
            {cart.lines.map((l) => (
              <li key={l.id} className="flex gap-5 py-6">
                <Link href={`/p/${l.productSlug}`} className="shrink-0">
                  <ProductImage src={l.imageUrl} alt={l.name} className="aspect-[4/5] w-20 rounded-none" sizes="80px" />
                </Link>
                <div className="flex flex-1 flex-col gap-1">
                  <Link href={`/p/${l.productSlug}`} className="font-serif text-lg font-medium leading-snug transition-colors hover:text-primary">
                    {l.name}
                  </Link>
                  {l.variantLabel && <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{l.variantLabel}</p>}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    {lineControls[l.id]}
                    <Price amount={l.lineTotal} currency={currency} locale={locale} className="[&>span]:font-normal" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <aside className="flex h-fit flex-col gap-5 border-t border-foreground/15 pt-6 lg:border-t-0 lg:border-s lg:ps-8 lg:pt-0">
            {couponSlot}
            <dl className="flex flex-col gap-2.5 text-sm">
              <Row label={labels.subtotal} value={money(totals.subtotal)} />
              {totals.discount > 0 && <Row label={labels.discount} value={`−${money(totals.discount)}`} />}
              <Row label={labels.shipping} value={totals.shipping === 0 ? labels.freeShipping : money(totals.shipping)} />
              {labels.shippingNote && <p className="text-xs text-muted-foreground">{labels.shippingNote}</p>}
              {totals.tax > 0 && <Row label={labels.tax} value={money(totals.tax)} muted />}
              <div className="my-2 border-t border-foreground/15" />
              <Row label={labels.total} value={money(totals.total)} strong />
            </dl>
            <Link href={checkoutHref} className={buttonVariants({ size: "lg", className: "w-full uppercase tracking-[0.15em]" })}>
              {labels.checkout}
            </Link>
            <Link href={shopHref} className={cn(textLink, "text-center")}>
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
    <div className={cn("flex items-baseline justify-between gap-4", muted && "text-muted-foreground")}>
      <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</dt>
      <dd className={cn("text-end tabular-nums", strong && "font-serif text-xl font-medium text-foreground")}>{value}</dd>
    </div>
  );
}
