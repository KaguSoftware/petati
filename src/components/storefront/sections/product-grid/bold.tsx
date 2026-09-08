import { Link } from "@/i18n/navigation";
import { renderSection } from "@/lib/theme/registry";
import { getTranslations } from "next-intl/server";
import type { ProductGridProps } from "../types";

/** Dense catalogue: tight gaps, four across on desktop, under a heavy title band. */
export async function ProductGridBold({ title, products, currency, locale, cardVariant, emptyLabel, wishlistSlots, viewAllHref, viewAllLabel }: ProductGridProps) {
  const t = await getTranslations("product");
  const labels = { new: t("new"), outOfStock: t("outOfStock") };
  return (
    <section className="py-10 @tablet:py-14">
      {(title || viewAllHref) && (
        <div className="bg-foreground text-background">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 @tablet:py-5">
            {title && <h2 className="text-2xl font-extrabold tracking-tight uppercase @tablet:text-4xl">{title}</h2>}
            {viewAllHref && (
              <Link href={viewAllHref} className="ms-auto shrink-0 border-2 border-background px-3 py-1.5 text-xs font-bold tracking-widest whitespace-nowrap uppercase transition-colors hover:bg-background hover:text-foreground">
                {viewAllLabel}
              </Link>
            )}
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 pt-4">
        {products.length === 0 ? (
          <p className="border-4 border-foreground py-16 text-center text-lg font-bold tracking-wide uppercase">{emptyLabel}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 @tablet:grid-cols-3 @desktop:grid-cols-4 @desktop:gap-3">
            {products.map((p) => (
              <li key={p.id}>{renderSection("productCard", cardVariant, { product: p, currency, locale, labels, wishlistSlot: wishlistSlots?.[p.id] })}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
