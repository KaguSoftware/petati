"use client";

import { useTranslations } from "next-intl";
import { REVIEW_STATUSES } from "@/lib/admin/reviews/types";
import type { ReviewStatus } from "@/lib/db/types";
import { StatusTabs } from "../shared/status-tabs";
import { useListNavigation } from "../shared/table-toolbar";

export function ReviewsTabs({ counts, current }: { counts: Record<ReviewStatus, number>; current: ReviewStatus }) {
  const t = useTranslations("admin");
  const { setParam } = useListNavigation();
  const items = REVIEW_STATUSES.map((s) => ({ value: s, label: t(`status.review.${s}`), count: counts[s] ?? 0 }));
  return <StatusTabs label={t("common.status")} value={current} items={items} onValueChange={(v) => setParam("status", v === "pending" ? null : v)} />;
}
