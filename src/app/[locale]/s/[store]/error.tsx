"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageShell } from "@/components/storefront/shared/page-shell";
import { EmptyState } from "@/components/storefront/shared/empty-state";

/**
 * The storefront's own error boundary. Previously the nearest one was `[locale]/error.tsx`, which
 * renders above the store layout — so any failure stripped the navbar, footer and store branding.
 */
export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  const tn = useTranslations("nav");
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error(error);
  }, [error]);

  return (
    <PageShell width="narrow">
      <EmptyState
        icon={TriangleAlert}
        title={t("error")}
        description={t("errorBody")}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button size="xl" onClick={reset}>
              {t("retry")}
            </Button>
            <Link href="/shop" className={buttonVariants({ size: "xl", variant: "outline" })}>
              {tn("shop")}
            </Link>
          </div>
        }
      />
    </PageShell>
  );
}
