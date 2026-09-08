"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ActionState } from "@/lib/admin/types";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * `useActionState` that toasts success/error. Error keys resolve under `admin.common.errors.*`
 * first, then `errorNamespace` (a module namespace) when given, else the raw text.
 */
export function useActionToast(action: Action, opts: { successMessage?: string; errorNamespace?: string; onSuccess?: (state: ActionState) => void; onError?: (state: ActionState) => void } = {}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const tCommon = useTranslations("admin.common");
  const tModule = useTranslations(opts.errorNamespace ?? "admin.common");
  const seen = useRef<ActionState | null>(null);

  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) {
      const key = state.error;
      const msg = tCommon.has(`errors.${key}`) ? tCommon(`errors.${key}`) : tModule.has(`errors.${key}`) ? tModule(`errors.${key}`) : key;
      toast.error(msg);
      opts.onError?.(state);
    } else if (state.ok) {
      toast.success(opts.successMessage ?? tCommon("saved"));
      opts.onSuccess?.(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast once per new state object
  }, [state]);

  return [state, formAction, pending] as const;
}
