import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { storeContext } from "@/lib/tenant/context";
import { getBrands } from "@/lib/catalog/queries";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/storefront/shared/brand-mark";

export async function generateMetadata({ params }: PageProps<"/[locale]/s/[store]/brands">): Promise<Metadata> {
  await storeContext(params);
  const t = await getTranslations("brands");
  return { title: t("title") };
}

/** Brand index: a tile per active brand linking to /b/<slug>. */
export default async function BrandsPage({ params }: PageProps<"/[locale]/s/[store]/brands">) {
  const ctx = await storeContext(params);
  const [t, brands] = await Promise.all([getTranslations("brands"), getBrands(ctx.store.id)]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">{t("title")}</h1>
      {brands.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((b) => (
            <li key={b.id}>
              <Link
                href={`/b/${b.slug}`}
                className="flex h-full flex-col items-center gap-3 rounded-xl border border-border bg-background p-5 text-center transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <BrandMark name={b.name} logoUrl={b.logoUrl} size={72} />
                <span className="font-medium">{b.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
