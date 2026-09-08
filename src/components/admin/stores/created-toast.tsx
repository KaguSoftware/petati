"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DRAFT_STORAGE_KEY } from "@/lib/admin/stores/defaults";

/** After the wizard redirects with `?created=<slug>`: toast once, drop the draft, strip the param. */
export function CreatedToast() {
  const params = useSearchParams();
  const t = useTranslations("stores");
  const created = params.get("created");

  useEffect(() => {
    if (!created) return;
    toast.success(t("created", { slug: created }));
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    // Strip the param without a navigation; Next syncs useSearchParams with history.replaceState.
    window.history.replaceState(null, "", window.location.pathname);
  }, [created, t]);

  return null;
}
