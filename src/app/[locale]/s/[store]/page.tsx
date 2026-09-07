import { getTranslations } from "next-intl/server";
import { getStoreBySlug } from "@/lib/tenant/store";

// SCOPE(storefront): placeholder until step 4 wires the theme registry. GROWS LATER → sections.
export default async function StoreHome({ params }: PageProps<"/[locale]/s/[store]">) {
  const { store: slug } = await params;
  const store = await getStoreBySlug(slug);
  const t = await getTranslations("home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-semibold">{store?.name}</h1>
      <p className="max-w-md text-muted-foreground">{t("heroSubtitle")}</p>
    </main>
  );
}
