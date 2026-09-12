"use client";

import { useState, useTransition, type ReactElement, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Props {
  /** The element that opens the dialog (rendered via Base UI `render`). */
  trigger: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: ReactNode;
  destructive?: boolean;
  onConfirm: () => void | Promise<unknown>;
}

/**
 * Confirmation for irreversible customer actions.
 *
 * The admin's `ConfirmDialog` is bound to the `admin.common` namespace and the admin `ActionState`
 * type, so it would put staff-facing wording in front of a shopper. Same Base UI primitive, the
 * customer's strings.
 */
export function ConfirmButton({ trigger, title, description, confirmLabel, destructive = false, onConfirm }: Props) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("cancel")}</AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={() =>
              start(async () => {
                await onConfirm();
                setOpen(false);
              })
            }
          >
            {confirmLabel ?? t("confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
