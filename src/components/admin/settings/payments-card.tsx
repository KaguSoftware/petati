import { CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Read-only summary of the payment provider.
 * SCOPE(payments): only the `manual` provider exists (orders wait for offline payment; admin marks
 * them paid). GROWS LATER → iyzico credentials form + webhook status here.
 */
export async function PaymentsCard() {
  const t = await getTranslations("admin.settings.payments");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="size-4 text-muted-foreground" aria-hidden />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{t("manual")}</span>
            <span className="text-xs text-muted-foreground">{t("manualHint")}</span>
          </div>
          <Badge variant="outline" className="border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            {t("active")}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2.5 text-muted-foreground">
          <div className="flex flex-col">
            <span className="text-sm font-medium">iyzico</span>
            <span className="text-xs">{t("iyzicoHint")}</span>
          </div>
          <Badge variant="outline">{t("comingSoon")}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
