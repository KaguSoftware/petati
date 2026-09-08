"use client";

import { Check, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { deleteReviewAction, moderateReviewAction } from "@/lib/admin/reviews/actions";
import type { ReviewStatus } from "@/lib/db/types";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { clearOptimistic, setOptimistic, useOptimisticRow } from "../shared/optimistic-store";
import { StatusBadge } from "../shared/status-badge";
import { useOptimisticAction } from "../shared/use-optimistic-action";

export function ReviewActions({ storeId, reviewId, status: serverStatus }: { storeId: string; reviewId: string; status: ReviewStatus }) {
  const t = useTranslations("admin.reviews");
  const tc = useTranslations("admin.common");
  const { status } = useOptimisticRow(reviewId, { status: serverStatus });
  const { run } = useOptimisticAction();
  const moderated = status !== serverStatus;

  function form() {
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("reviewId", reviewId);
    return fd;
  }

  /** Optimistic: the badge flips at once; the row leaves this tab when the server refresh lands. */
  function setStatus(next: "approved" | "rejected") {
    const fd = form();
    fd.set("status", next);
    run(() => moderateReviewAction({}, fd), {
      optimistic: () => setOptimistic(reviewId, { status: next }),
      rollback: () => clearOptimistic(reviewId, ["status"]),
      success: t(next === "approved" ? "approvedToast" : "rejectedToast"),
    });
  }

  if (moderated) {
    return (
      <div className="flex items-center justify-end">
        <StatusBadge kind="review" value={status} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {status !== "approved" && (
        <Button size="sm" variant="outline" onClick={() => setStatus("approved")} className="text-emerald-700 dark:text-emerald-300">
          <Check data-icon="inline-start" />
          {t("approve")}
        </Button>
      )}
      {status !== "rejected" && (
        <Button size="sm" variant="outline" onClick={() => setStatus("rejected")}>
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
