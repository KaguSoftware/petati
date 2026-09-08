"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, start] = useTransition();
  const items = stores.map((s) => ({ value: s.id, label: s.name }));

  return (
    <Select
      items={items}
      value={current}
      modal={false}
      disabled={pending}
      onValueChange={(value) => {
        if (!value || value === current) return;
        start(async () => {
          await switchAdminStoreAction(String(value));
          router.refresh();
        });
      }}
    >
      <SelectTrigger size="sm" aria-label={t("nav.switchStore")} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
