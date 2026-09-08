"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveInternalNoteAction } from "@/lib/admin/orders/actions";
import { useActionToast } from "../shared/use-action-toast";

export function InternalNoteForm({ storeId, orderId, note }: { storeId: string; orderId: string; note: string | null }) {
  const t = useTranslations("admin");
  const [, action, pending] = useActionToast(saveInternalNoteAction, { errorNamespace: "admin.orders" });
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="orderId" value={orderId} />
      <Textarea name="internal_note" defaultValue={note ?? ""} rows={3} placeholder={t("orders.note.placeholder")} aria-label={t("orders.note.internal")} />
      <Button type="submit" size="sm" variant="outline" className="self-end" disabled={pending}>
        {t("common.save")}
      </Button>
    </form>
  );
}
