"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { switchAdminStoreAction } from "@/lib/admin/actions";

/**
 * SCOPE(multi-store, unpaid): rendered only when FEATURE_MULTI_STORE is on and the user is Owner.
 * GROWS LATER → full store list page with create wizard.
 */
export function StoreSwitcher({
  current,
  stores,
}: {
  current: string;
  stores: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
      value={current}
      disabled={pending}
      onChange={(e) =>
        start(async () => {
          await switchAdminStoreAction(e.target.value);
          router.refresh();
        })
      }
    >
      {stores.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
