import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { renderSection } from "@/lib/theme/registry";
import { getTranslations } from "next-intl/server";
import type { ProductGridProps } from "../types";

/** Large cards: one per row on phones, two on tablets, three on desktop. */
export async function ProductGridMinimal({ title, products, currency, locale, cardVariant, emptyLabel, wishlistSlots, viewAllHref, viewAllLabel }: ProductGridProps) {
  const t = await getTranslations("product");
  const labels = { new: t("new"), outOfStock: t("outOfStock") };
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 @desktop:py-16">
      {(title || viewAllHref) && (
        <div className="mb-6 flex items-end justify-between gap-4">
          {title && <h2 className="text-2xl font-semibold tracking-tight @tablet:text-3xl">{title}</h2>}
          {viewAllHref && (
            <Link href={viewAllHref} className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {viewAllLabel}
              <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </Link>
          )}
        </div>
      )}
      {products.length === 0 ? (
        <p className="rounded-xl bg-muted py-12 text-center text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-5 @phablet:grid-cols-2 @desktop:grid-cols-3 @desktop:gap-6">
          {products.map((p) => (
            <li key={p.id}>{renderSection("productCard", cardVariant, { product: p, currency, locale, labels, wishlistSlot: wishlistSlots?.[p.id] })}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
