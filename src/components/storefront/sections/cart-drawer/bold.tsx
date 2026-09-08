import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Price } from "@/components/storefront/shared/price";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CartViewProps } from "../types";

const bigButton = "h-14 rounded-none px-8 text-base font-extrabold tracking-wide uppercase";

export function CartViewBold({ cart, totals, currency, locale, labels, lineControls, couponSlot, checkoutHref, shopHref }: CartViewProps) {
  const money = (n: number) => formatMoney(n, currency, locale);
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 @tablet:py-14">
      <h1 className="mb-8 text-4xl font-extrabold tracking-tight uppercase @tablet:text-6xl">{labels.title}</h1>
      {cart.lines.length === 0 ? (
        <div className="flex flex-col items-center gap-6 border-4 border-foreground px-4 py-20 text-center">
          <p className="text-xl font-bold tracking-wide uppercase">{labels.empty}</p>
          <Link href={shopHref} className={cn(buttonVariants({ variant: "outline", size: "lg" }), bigButton, "border-2 border-foreground")}>
            {labels.continueShopping}
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 @desktop:grid-cols-[1fr_380px]">
          <ul className="divide-y-2 divide-foreground border-y-4 border-foreground">
            {cart.lines.map((l) => (
              <li key={l.id} className="flex gap-4 py-5 @tablet:gap-6">
                <Link href={`/p/${l.productSlug}`} className="shrink-0 border-2 border-foreground">
                  <ProductImage src={l.imageUrl} alt={l.name} className="size-24 @tablet:size-28" sizes="112px" />
                </Link>
                <div className="flex flex-1 flex-col gap-1">
                  <Link
                    href={`/p/${l.productSlug}`}
                    className="text-base leading-tight font-extrabold tracking-tight uppercase decoration-2 underline-offset-4 hover:underline"
                  >
                    {l.name}
                  </Link>
                  {l.variantLabel && <p className="text-sm font-medium text-muted-foreground">{l.variantLabel}</p>}
                  <div className="mt-auto flex items-center justify-between gap-4 pt-2">
                    {lineControls[l.id]}
                    <Price amount={l.lineTotal} currency={currency} locale={locale} className="text-lg font-extrabold" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <aside className="flex h-fit flex-col gap-4">
            <div className="border-2 border-foreground p-4">{couponSlot}</div>
            <div className="flex flex-col gap-4 bg-foreground p-6 text-background">
              <dl className="flex flex-col gap-2 text-sm font-medium">
                <Row label={labels.subtotal} value={money(totals.subtotal)} />
                {totals.discount > 0 && <Row label={labels.discount} value={`−${money(totals.discount)}`} />}
                <Row label={labels.shipping} value={totals.shipping === 0 ? labels.freeShipping : money(totals.shipping)} />
                {labels.shippingNote && <p className="text-xs text-background/70">{labels.shippingNote}</p>}
                {totals.tax > 0 && <Row label={labels.tax} value={money(totals.tax)} muted />}
                <div className="my-2 border-t-2 border-background/30" />
                <Row label={labels.total} value={money(totals.total)} strong />
              </dl>
              <Link href={checkoutHref} className={cn(buttonVariants({ size: "lg" }), bigButton, "bg-accent text-accent-foreground hover:bg-accent/90")}>
                {labels.checkout}
              </Link>
              <Link
                href={shopHref}
                className="text-center text-xs font-bold tracking-widest uppercase underline decoration-2 underline-offset-4 hover:decoration-4"
              >
                {labels.continueShopping}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4", strong && "items-baseline text-base font-extrabold uppercase", muted && "text-background/70")}>
      <dt>{label}</dt>
      <dd className={cn("text-end tabular-nums", strong && "text-3xl tracking-tight")}>{value}</dd>
    </div>
  );
}
