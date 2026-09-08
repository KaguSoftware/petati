import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { renderSection } from "@/lib/theme/registry";
import { getTranslations } from "next-intl/server";
import type { ProductGridProps } from "../types";

export async function ProductGridEditorial({ title, products, currency, locale, cardVariant, emptyLabel, wishlistSlots, viewAllHref, viewAllLabel }: ProductGridProps) {
  const t = await getTranslations("product");
  const labels = { new: t("new"), outOfStock: t("outOfStock") };
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      {(title || viewAllHref) && (
        <div className="mb-10 flex items-end justify-between gap-6 border-b border-foreground/15 pb-4">
          {title && <h2 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">{title}</h2>}
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="inline-flex shrink-0 items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {viewAllLabel}
              <ArrowRight aria-hidden className="size-3.5 rtl:rotate-180" />
            </Link>
          )}
        </div>
      )}
      {products.length === 0 ? (
        <p className="py-12 text-center font-serif text-lg italic text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
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
