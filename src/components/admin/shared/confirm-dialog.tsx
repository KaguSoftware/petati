"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
import type { ActionState } from "@/lib/admin/types";

interface Props {
  /** The element that opens the dialog (rendered via Base UI `render`). */
  trigger: React.ReactElement;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: ReactNode;
  destructive?: boolean;
  /** Server action to run on confirm. */
  action: () => Promise<ActionState | void>;
  /** Extra content between description and footer (e.g. a "type the slug" input). */
  children?: ReactNode;
  /** Disable the confirm button until this is true (for typed confirmations). */
  canConfirm?: boolean;
}

/** Confirmation dialog wrapping a server action; toasts the result. */
export function ConfirmDialog({ trigger, title, description, confirmLabel, destructive = false, action, children, canConfirm = true }: Props) {
  const t = useTranslations("admin.common");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    try {
      const res = await action();
      if (res && res.error) toast.error(t.has(`errors.${res.error}`) ? t(`errors.${res.error}`) : res.error);
      else setOpen(false);
    } catch {
      toast.error(t("errors.failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("cancel")}</AlertDialogCancel>
          <Button variant={destructive ? "destructive" : "default"} onClick={run} disabled={pending || !canConfirm}>
            {confirmLabel ?? t("confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
