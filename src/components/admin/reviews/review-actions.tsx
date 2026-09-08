"use client";

import { Check, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteReviewAction, moderateReviewAction } from "@/lib/admin/reviews/actions";
import type { ReviewStatus } from "@/lib/db/types";
import { ConfirmDialog } from "../shared/confirm-dialog";

export function ReviewActions({ storeId, reviewId, status }: { storeId: string; reviewId: string; status: ReviewStatus }) {
  const t = useTranslations("admin.reviews");
  const tc = useTranslations("admin.common");
  const [pending, start] = useTransition();

  function form() {
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("reviewId", reviewId);
    return fd;
  }

  /** The row leaves this tab once moderated, so the toast is fired here rather than from an effect on the (unmounted) row. */
  function setStatus(next: "approved" | "rejected") {
    const fd = form();
    fd.set("status", next);
    start(async () => {
      const res = await moderateReviewAction({}, fd);
      if (res.error) toast.error(tc.has(`errors.${res.error}`) ? tc(`errors.${res.error}`) : res.error);
      else toast.success(t(next === "approved" ? "approvedToast" : "rejectedToast"));
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {status !== "approved" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("approved")} className="text-emerald-700 dark:text-emerald-300">
          <Check data-icon="inline-start" />
          {t("approve")}
        </Button>
      )}
      {status !== "rejected" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("rejected")}>
          <X data-icon="inline-start" />
          {t("reject")}
        </Button>
      )}
      <ConfirmDialog
        trigger={
          <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-destructive" aria-label={t("delete")} title={t("delete")}>
            <Trash2 />
          </Button>
        }
        title={t("deleteConfirm")}
        description={t("deleteDescription")}
        confirmLabel={tc("delete")}
        destructive
        action={() => deleteReviewAction({}, form())}
      />
    </div>
  );
}
