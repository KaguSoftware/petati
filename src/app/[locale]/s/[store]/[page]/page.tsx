import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { storeContext } from "@/lib/tenant/context";

const PAGES = ["privacy", "terms", "about"] as const;

/**
 * Simple content pages read from store.settings.pages.<key>.<locale> (markdown-ish plain text).
 * SCOPE(content-pages): plain text only. GROWS LATER → rich text editor in admin settings.
 */
export default async function ContentPage({ params }: PageProps<"/[locale]/s/[store]/[page]">) {
  const { store, locale, fallback } = await storeContext(params);
  const { page } = await params;
  if (!(PAGES as readonly string[]).includes(page)) notFound();
  const t = await getTranslations("footer");
  const pages = (store.settings.pages ?? {}) as Record<string, Record<string, string>>;
  const body = pages[page]?.[locale] ?? pages[page]?.[fallback] ?? "";
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">{t(page as (typeof PAGES)[number])}</h1>
      <div className="whitespace-pre-line text-muted-foreground">{body || "—"}</div>
    </main>
  );
}
