import { Link } from "@/i18n/navigation";
import { Price } from "@/components/storefront/shared/price";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import type { ProductCardProps } from "../types";

export function ProductCardMinimal({ product, currency, locale, labels, wishlistSlot }: ProductCardProps) {
  return (
    <article className="group relative flex flex-col gap-2">
      <Link href={`/p/${product.slug}`} className="relative block">
        <ProductImage src={product.imageUrl} alt={product.imageAlt} className="aspect-square rounded-lg transition group-hover:opacity-90" />
        {product.isNew && (
          <span className="absolute start-2 top-2 rounded-full bg-background px-2 py-0.5 text-[11px] font-medium">{labels.new}</span>
        )}
        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-foreground/80 py-1 text-center text-xs text-background">{labels.outOfStock}</span>
        )}
      </Link>
      {wishlistSlot && <div className="absolute end-2 top-2">{wishlistSlot}</div>}
      <div className="flex flex-col gap-0.5">
        {product.brand && <p className="truncate text-xs text-muted-foreground">{product.brand}</p>}
        <Link href={`/p/${product.slug}`} className="line-clamp-2 text-sm font-medium hover:underline">
          {product.name}
        </Link>
        {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} />}
        <Price amount={product.price} compareAt={product.compareAtPrice} currency={currency} locale={locale} className="text-sm" />
      </div>
    </article>
  );
}
