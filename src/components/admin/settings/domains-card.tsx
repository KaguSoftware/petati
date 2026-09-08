import { ArrowRight, Globe } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

/**
 * SCOPE(multi-store, unpaid): rendered only when the admin context says `multiStore` (flag on AND
 * Owner). Domain actions live in the stores module; this card only links there.
 */
export async function DomainsCard({ slug }: { slug: string }) {
  const t = await getTranslations("admin.settings.domains");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground" aria-hidden />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description", { slug })}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/admin/stores" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("manage")}
          <ArrowRight data-icon="inline-end" className="rtl:-scale-x-100" />
        </Link>
      </CardContent>
    </Card>
  );
}
