"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Globe, LayoutDashboard, MoreHorizontal, Power, PowerOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { switchAdminStoreAction } from "@/lib/admin/actions";
import { deleteStoreAction, setStoreActiveAction } from "@/lib/admin/stores/actions";
import type { ActionState } from "@/lib/admin/types";
import type { StoreDomainRow } from "@/lib/db/types";
import { StoreDomainsDialog } from "./store-domains-dialog";

interface Props {
  store: { id: string; name: string; slug: string; is_active: boolean; domains: StoreDomainRow[] };
  /** Server-computed public URL of the storefront. */
  storefrontUrl: string;
  isDefault: boolean;
  rootDomain: string;
}

type DialogKind = "activate" | "deactivate" | "delete" | "domains" | null;

/** Per-row menu on the stores list. Destructive actions are hidden for the default store. */
export function StoreRowActions({ store, storefrontUrl, isDefault, rootDomain }: Props) {
  const t = useTranslations("stores");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();
  const close = () => {
    setDialog(null);
    setTyped("");
  };

  function report(res: ActionState) {
    if (res.error) {
      const key = res.error;
      toast.error(t.has(`errors.${key}`) ? t(`errors.${key}`) : tc.has(`errors.${key}`) ? tc(`errors.${key}`) : key);
      return false;
    }
    return true;
  }

  function openAdmin() {
    start(async () => {
      try {
        await switchAdminStoreAction(store.id);
        router.push("/admin");
        router.refresh();
      } catch {
        toast.error(tc("errors.failed"));
      }
    });
  }

  function toggleActive(active: boolean) {
    start(async () => {
      const res = await setStoreActiveAction(store.id, active);
      if (report(res)) {
        toast.success(tc("saved"));
        close();
      }
    });
  }

  function remove() {
    start(async () => {
      const res = await deleteStoreAction(store.id, typed);
      if (report(res)) {
        toast.success(tc("saved"));
        close();
      }
    });
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={t("actions.menu")} disabled={pending} />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem onClick={openAdmin}>
            <LayoutDashboard />
            {t("actions.openAdmin")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href={storefrontUrl} target="_blank" rel="noreferrer" />}>
            <ExternalLink />
            {t("actions.openStorefront")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog("domains")}>
            <Globe />
            {t("actions.domains")}
          </DropdownMenuItem>
          {!isDefault && (
            <>
              <DropdownMenuSeparator />
              {store.is_active ? (
                <DropdownMenuItem onClick={() => setDialog("deactivate")}>
                  <PowerOff />
                  {t("actions.deactivate")}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setDialog("activate")}>
                  <Power />
                  {t("actions.activate")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
                <Trash2 />
                {t("actions.delete")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={dialog === "activate" || dialog === "deactivate"} onOpenChange={(o) => !o && close()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(`${dialog === "activate" ? "activate" : "deactivate"}.title`, { name: store.name })}</AlertDialogTitle>
            <AlertDialogDescription>{t(`${dialog === "activate" ? "activate" : "deactivate"}.description`)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{tc("cancel")}</AlertDialogCancel>
            <Button onClick={() => toggleActive(dialog === "activate")} disabled={pending}>
              {dialog === "activate" ? t("actions.activate") : t("actions.deactivate")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialog === "delete"} onOpenChange={(o) => !o && close()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.title", { name: store.name })}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`confirm-slug-${store.id}`}>{t("delete.confirmLabel")}</Label>
            <Input id={`confirm-slug-${store.id}`} dir="ltr" value={typed} placeholder={store.slug} autoComplete="off" spellCheck={false} onChange={(e) => setTyped(e.target.value)} className="font-mono text-sm" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{tc("cancel")}</AlertDialogCancel>
            <Button variant="destructive" onClick={remove} disabled={pending || typed.trim().toLowerCase() !== store.slug.toLowerCase()}>
              {t("delete.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StoreDomainsDialog open={dialog === "domains"} onOpenChange={(o) => !o && close()} store={store} rootDomain={rootDomain} />
    </>
  );
}
