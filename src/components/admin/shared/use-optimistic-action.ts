"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ActionState } from "@/lib/admin/types";

interface RunOptions {
  /** Applied immediately, before the server answers. */
  optimistic?: () => void;
  /** Undo the optimistic change when the server rejects or throws. */
  rollback?: () => void;
  /** Toast on success; omit to stay quiet (the optimistic UI already shows the result). */
  success?: string;
  onSuccess?: (state: ActionState) => void;
}

/**
 * One way to fire a server action from a client control: optimistic apply → run → on failure
 * roll back and toast the reason (keys resolve under `admin.common.errors.*`, then the module
 * namespace). Success is silent unless a message is given. Mirrors `useActionToast` for forms.
 */
export function useOptimisticAction(errorNamespace?: string) {
  const [pending, startTransition] = useTransition();
  const tCommon = useTranslations("admin.common");
  const tModule = useTranslations(errorNamespace ?? "admin.common");

  function message(key: string) {
    return tCommon.has(`errors.${key}`) ? tCommon(`errors.${key}`) : tModule.has(`errors.${key}`) ? tModule(`errors.${key}`) : key;
  }

  function run(fn: () => Promise<ActionState>, opts: RunOptions = {}) {
    opts.optimistic?.();
    startTransition(async () => {
      try {
        const res = await fn();
        if (res.error) {
          opts.rollback?.();
          toast.error(message(res.error));
          return;
        }
        if (opts.success) toast.success(opts.success);
        opts.onSuccess?.(res);
      } catch {
        opts.rollback?.();
        toast.error(tCommon("errors.failed"));
      }
    });
  }

  return { pending, run };
}
