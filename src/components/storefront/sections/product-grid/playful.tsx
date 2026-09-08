import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { renderSection } from "@/lib/theme/registry";
import { getTranslations } from "next-intl/server";
import type { ProductGridProps } from "../types";

/** Carousel: one row that scrolls sideways and snaps to each card. */
export async function ProductGridPlayful({ title, products, currency, locale, cardVariant, emptyLabel, wishlistSlots, viewAllHref, viewAllLabel }: ProductGridProps) {
  const t = await getTranslations("product");
  const labels = { new: t("new"), outOfStock: t("outOfStock") };
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 @tablet:py-14">
      {(title || viewAllHref) && (
        <div className="mb-6 flex items-center justify-between gap-4">
          {title && (
            <h2 className="relative text-2xl font-bold tracking-tight @tablet:text-3xl">
              <span className="relative z-10">{title}</span>
              <span aria-hidden className="absolute start-0 bottom-0.5 h-3 w-16 rounded-full bg-accent/50" />
            </h2>
          )}
          {viewAllHref && (
            <Link href={viewAllHref} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-accent/20 hover:text-accent-foreground">
              {viewAllLabel}
              <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
            </Link>
          )}
        </div>
      )}
      {products.length === 0 ? (
        <p className="rounded-3xl bg-muted py-12 text-center text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-2 pb-6 contain-inline-size [scrollbar-width:thin]">
          {products.map((p) => (
            <li key={p.id} className="w-[82%] shrink-0 snap-start @phablet:w-[46%] @desktop:w-[31.5%]">
              {renderSection("productCard", cardVariant, { product: p, currency, locale, labels, wishlistSlot: wishlistSlots?.[p.id] })}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
