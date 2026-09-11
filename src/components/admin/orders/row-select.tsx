"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { setSelected, toggleSelected, useIsSelected, useSelection } from "../shared/selection-store";

/** One row's checkbox. Tiny on purpose: the rest of the table stays a server component. */
export function RowCheckbox({ scope, id }: { scope: string; id: string }) {
  const t = useTranslations("admin.common");
  const checked = useIsSelected(scope, id);
  return <Checkbox checked={checked} onCheckedChange={() => toggleSelected(scope, id)} aria-label={t("selectRow")} />;
}

/** Header checkbox: all / none for the rows currently on the page, indeterminate in between. */
export function SelectAllCheckbox({ scope, ids }: { scope: string; ids: string[] }) {
  const t = useTranslations("admin.common");
  const selected = useSelection(scope);
  const onPage = ids.filter((id) => selected.has(id)).length;
  const all = ids.length > 0 && onPage === ids.length;
  return (
    <Checkbox
      checked={all}
      indeterminate={onPage > 0 && !all}
      onCheckedChange={(value) => setSelected(scope, ids, Boolean(value))}
      aria-label={t("selectAll")}
    />
  );
}
