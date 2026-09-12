import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PageShell } from "@/components/storefront/shared/page-shell";
import { EmptyState } from "@/components/storefront/shared/empty-state";
import { SearchForm } from "@/components/storefront/shared/search-form";

/**
 * The storefront's own 404. Without this file, `notFound()` from any shop page resolved to
 * `[locale]/not-found.tsx`, which sits ABOVE `s/[store]/layout.tsx` — so a customer who mistyped a
 * product URL landed on a bare "404" with no navbar, no footer, no logo and no way to search. This
 * one renders inside the store chrome and gives them somewhere to go.
 *
 * `not-found.tsx` receives no params, so it cannot read the tenant; the links below are the
 * locale-aware public paths that exist for every store.
 */
export default async function StoreNotFound() {
  const [t, tn] = await Promise.all([getTranslations("common"), getTranslations("nav")]);
  return (
    <PageShell width="narrow">
      <EmptyState
        icon={Compass}
        title={t("notFound")}
        description={t("notFoundBody")}
        action={
          <div className="flex flex-col items-center gap-5">
            <Suspense fallback={<div className="h-10 w-full max-w-sm rounded-lg bg-muted" />}>
              <SearchForm placeholder={tn("search")} className="w-full max-w-sm" />
            </Suspense>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/shop" className={buttonVariants({ size: "xl" })}>
                {tn("shop")}
              </Link>
              <Link href="/brands" className={buttonVariants({ size: "xl", variant: "outline" })}>
                {tn("brands")}
              </Link>
              <Link href="/" className={buttonVariants({ size: "xl", variant: "ghost" })}>
                {tn("home")}
              </Link>
            </div>
          </div>
        }
      />
    </PageShell>
  );
}
