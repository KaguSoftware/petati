"use client";

import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LatinInput } from "@/components/forms/latin-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteStaffAction } from "@/lib/admin/staff/actions";
import { STORE_ROLES } from "@/lib/admin/staff/types";
import { FormField } from "../shared/form-field";
import { useActionToast } from "../shared/use-action-toast";

interface Props {
  storeId: string;
  locale: string;
  size?: "default" | "sm";
}

/** "Invite" button + dialog: email (Latin, LTR) and role. Existing accounts are added directly. */
export function InviteDialog({ storeId, locale, size = "default" }: Props) {
  const t = useTranslations("admin.staff.invite");
  const tr = useTranslations("admin.roles");
  const tc = useTranslations("admin.common");
  const [open, setOpen] = useState(false);
  const roleItems = STORE_ROLES.map((r) => ({ value: r, label: tr(r) }));
  const [state, action, pending] = useActionToast(inviteStaffAction, {
    errorNamespace: "admin.staff",
    successMessage: t("sent"),
    onSuccess: () => setOpen(false),
  });

  return (
    <>
      <Button type="button" size={size} onClick={() => setOpen(true)}>
        <UserPlus data-icon="inline-start" />
        {t("button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form action={action} className="flex flex-col gap-4">
            <input type="hidden" name="storeId" value={storeId} />
            <input type="hidden" name="locale" value={locale} />
            <DialogHeader>
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>{t("description")}</DialogDescription>
            </DialogHeader>
            <FormField name="email" label={t("email")} errors={state.fieldErrors} required>
              <LatinInput kind="email" id="email" name="email" required autoComplete="off" placeholder="name@example.com" />
            </FormField>
            <FormField name="role" label={t("role")} description={t("roleHint")} errors={state.fieldErrors}>
              <Select items={roleItems} name="role" defaultValue="staff" modal={false}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {STORE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {tr(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? t("sending") : t("submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
