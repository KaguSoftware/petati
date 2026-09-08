import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import { formatMoney } from "@/lib/money";
import type { ProductCardProps } from "../types";

export function ProductCardPlayful({ product, currency, locale, labels, wishlistSlot }: ProductCardProps) {
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  return (
    <article className="group relative flex flex-col gap-3 rounded-3xl bg-background p-3 shadow-lg shadow-primary/10 ring-1 ring-foreground/5 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none">
      <Link href={`/p/${product.slug}`} className="relative block overflow-hidden rounded-2xl">
        <ProductImage
          src={product.imageUrl}
          alt={product.imageAlt}
          className="aspect-square rounded-2xl transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
        />
        {product.isNew && (
          <span className="absolute start-2 top-2 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground shadow-sm">{labels.new}</span>
        )}
        {!product.inStock && (
          <span className="absolute inset-x-2 bottom-2 rounded-full bg-foreground/80 py-1 text-center text-xs font-semibold text-background">{labels.outOfStock}</span>
        )}
      </Link>
      {wishlistSlot && <div className="absolute end-5 top-5">{wishlistSlot}</div>}
      <div className="flex flex-col gap-1.5 px-1 pb-1">
        {product.brand && <p className="truncate text-xs font-medium text-muted-foreground">{product.brand}</p>}
        <Link href={`/p/${product.slug}`} className="line-clamp-2 text-sm font-semibold hover:underline">
          {product.name}
        </Link>
        {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} />}
        <p className="mt-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground tabular-nums">
            {formatMoney(product.price, currency, locale)}
          </span>
          {onSale && product.compareAtPrice !== null && (
            <s className="text-xs text-muted-foreground tabular-nums">{formatMoney(product.compareAtPrice, currency, locale)}</s>
          )}
        </p>
      </div>
    </article>
  );
}
