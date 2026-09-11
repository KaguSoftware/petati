import { Coins, ScrollText, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** Base UI buttons have no `asChild`, so a link that looks like a button uses buttonVariants(). */
export async function DeliveryNavActions() {
  const t = await getTranslations("admin.delivery");
  return (
    <>
      <Link href="/admin/delivery/couriers" className={buttonVariants({ variant: "outline", size: "sm" })}>
        <Users data-icon="inline-start" />
        {t("couriers.title")}
      </Link>
      <Link href="/admin/delivery/cash" className={buttonVariants({ variant: "outline", size: "sm" })}>
        <Coins data-icon="inline-start" />
        {t("cash.title")}
      </Link>
      <Link href="/admin/delivery/log" className={buttonVariants({ variant: "outline", size: "sm" })}>
        <ScrollText data-icon="inline-start" />
        {t("log.title")}
      </Link>
    </>
  );
}
