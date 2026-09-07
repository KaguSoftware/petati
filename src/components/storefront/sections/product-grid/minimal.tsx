import { Link } from "@/i18n/navigation";
import { renderSection } from "@/lib/theme/registry";
import { getTranslations } from "next-intl/server";
import type { ProductGridProps } from "../types";

export async function ProductGridMinimal({ title, products, currency, locale, cardVariant, emptyLabel, wishlistSlots, viewAllHref, viewAllLabel }: ProductGridProps) {
  const t = await getTranslations("product");
  const labels = { new: t("new"), outOfStock: t("outOfStock") };
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      {(title || viewAllHref) && (
        <div className="mb-5 flex items-baseline justify-between">
          {title && <h2 className="text-xl font-semibold tracking-tight">{title}</h2>}
          {viewAllHref && (
            <Link href={viewAllHref} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              {viewAllLabel}
            </Link>
          )}
        </div>
      )}
      {products.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
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
