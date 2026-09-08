"use client";

import { useTranslations } from "next-intl";
import { TableToolbar } from "../shared/table-toolbar";
import { NewCouponButton } from "./coupon-dialog";

export function CouponsToolbar({ storeId, currency }: { storeId: string; currency: string }) {
  const t = useTranslations("admin.coupons");
  return <TableToolbar searchPlaceholder={t("searchPlaceholder")} actions={<NewCouponButton storeId={storeId} currency={currency} />} />;
}
