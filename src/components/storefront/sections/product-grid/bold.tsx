import { Link } from "@/i18n/navigation";
import { renderSection } from "@/lib/theme/registry";
import { getTranslations } from "next-intl/server";
import type { ProductGridProps } from "../types";

export async function ProductGridBold({ title, products, currency, locale, cardVariant, emptyLabel, wishlistSlots, viewAllHref, viewAllLabel }: ProductGridProps) {
  const t = await getTranslations("product");
  const labels = { new: t("new"), outOfStock: t("outOfStock") };
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 @tablet:py-16">
      {(title || viewAllHref) && (
        <div className="mb-8 flex items-end justify-between gap-4 border-b-4 border-foreground pb-4">
          {title && <h2 className="text-3xl font-extrabold tracking-tight uppercase @tablet:text-5xl">{title}</h2>}
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="ms-auto shrink-0 text-xs font-bold tracking-widest whitespace-nowrap uppercase underline decoration-2 underline-offset-4 hover:decoration-4"
            >
              {viewAllLabel}
            </Link>
          )}
        </div>
      )}
      {products.length === 0 ? (
        <p className="border-4 border-foreground py-16 text-center text-lg font-bold tracking-wide uppercase">{emptyLabel}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 @tablet:grid-cols-3 @desktop:grid-cols-4">
          {products.map((p) => (
            <li key={p.id}>
              {renderSection("productCard", cardVariant, { product: p, currency, locale, labels, wishlistSlot: wishlistSlots?.[p.id] })}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
