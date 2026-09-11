"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { setSelected, toggleSelected, useIsSelected, useSelection } from "../shared/selection-store";

/** Row ticker. Kept tiny so the table itself stays a server component. */
export function DeliveryRowCheckbox({ scope, id }: { scope: string; id: string }) {
  const t = useTranslations("admin.common");
  return <Checkbox checked={useIsSelected(scope, id)} onCheckedChange={() => toggleSelected(scope, id)} aria-label={t("selectRow")} />;
}

export function DeliverySelectAll({ scope, ids }: { scope: string; ids: string[] }) {
  const t = useTranslations("admin.common");
  const selected = useSelection(scope);
  const onPage = ids.filter((id) => selected.has(id)).length;
  const all = ids.length > 0 && onPage === ids.length;
  return <Checkbox checked={all} indeterminate={onPage > 0 && !all} onCheckedChange={(v) => setSelected(scope, ids, Boolean(v))} aria-label={t("selectAll")} />;
}
