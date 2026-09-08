"use client";

import { BarChart3, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "@/i18n/navigation";
import { deleteCouponAction, toggleCouponAction } from "@/lib/admin/coupons/actions";
import type { CouponRow } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { clearOptimistic, setOptimistic, useOptimisticRow } from "../shared/optimistic-store";
import { useOptimisticAction } from "../shared/use-optimistic-action";
import { CouponDialog } from "./coupon-dialog";

/** Inline active toggle: flips instantly, rolls back if the server rejects. */
export function CouponActiveSwitch({ storeId, coupon }: { storeId: string; coupon: CouponRow }) {
  const t = useTranslations("admin.coupons");
  const row = useOptimisticRow(coupon.id, { is_active: coupon.is_active });
  const { run } = useOptimisticAction("admin.coupons");
  return (
    <Switch
      size="sm"
      checked={row.is_active}
      aria-label={`${t("active")} · ${coupon.code}`}
      onCheckedChange={(next) => {
        const fd = new FormData();
        fd.set("storeId", storeId);
        fd.set("couponId", coupon.id);
        fd.set("is_active", next ? "on" : "");
        run(() => toggleCouponAction({}, fd), {
          optimistic: () => setOptimistic(coupon.id, { is_active: next }),
          rollback: () => clearOptimistic(coupon.id, ["is_active"]),
        });
      }}
    />
  );
}

export function CouponRowActions({ storeId, currency, coupon }: { storeId: string; currency: string; coupon: CouponRow }) {
  const t = useTranslations("admin.coupons");
  const tc = useTranslations("admin.common");
  const [editOpen, setEditOpen] = useState(false);
  const [session, setSession] = useState(0);
  /** Snapshot taken when the dialog opens: the row's `coupon` prop refreshes after a save while the dialog is still closing. */
  const [snapshot, setSnapshot] = useState<CouponRow>(coupon);
  const iconBtn = cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground hover:text-foreground");

  async function remove() {
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("couponId", coupon.id);
    const res = await deleteCouponAction({}, fd);
    // ConfirmDialog resolves admin.common.errors.*; module keys are translated here so the toast reads well.
    if (res.error && t.has(`errors.${res.error}`)) return { error: t(`errors.${res.error}`) };
    return res;
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-foreground"
        aria-label={t("edit")}
        title={t("edit")}
        onClick={() => {
          setSnapshot(coupon);
          setSession((s) => s + 1);
          setEditOpen(true);
        }}
      >
        <Pencil />
      </Button>
      {/* the code cell already links to the usage page, so this shortcut can go below sm */}
      <Link href={`/admin/coupons/${coupon.id}`} className={cn(iconBtn, "hidden sm:inline-flex")} aria-label={t("usage")} title={t("usage")}>
        <BarChart3 />
      </Link>
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={t("delete")} title={t("delete")}>
            <Trash2 />
          </Button>
        }
        title={t("deleteConfirm", { code: coupon.code })}
        description={t("deleteDescription")}
        confirmLabel={tc("delete")}
        destructive
        action={remove}
      />
      {/* Mounted only while open: after a save the row receives fresh props and a lingering dialog would see its defaults change. */}
      {editOpen && <CouponDialog key={session} storeId={storeId} currency={currency} coupon={snapshot} open={editOpen} onOpenChange={setEditOpen} />}
    </div>
  );
}
