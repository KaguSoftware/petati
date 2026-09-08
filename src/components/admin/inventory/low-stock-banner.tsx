import { AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** Warning strip above the stock table when tracked variants sit at or below the threshold. */
export async function LowStockBanner({ count, threshold, locale }: { count: number; threshold: number; locale: string }) {
  if (count <= 0) return null;
  const t = await getTranslations("admin.inventory");
  const num = new Intl.NumberFormat(locale);
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
      <AlertTriangle className="size-4 shrink-0 text-amber-700 dark:text-amber-300" />
      <span className="flex-1">{t("lowBanner", { count: num.format(count), threshold: num.format(threshold) })}</span>
      <Link href="/admin/inventory?low=1" className={buttonVariants({ variant: "outline", size: "sm" })}>
        {t("viewLow")}
      </Link>
    </div>
  );
}
