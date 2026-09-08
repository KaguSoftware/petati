"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { deleteExpenseAction } from "@/lib/admin/finance/actions";
import type { ExpenseCategoryRow, ExpenseListRow } from "@/lib/admin/finance/types";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { ExpenseDialog } from "./expense-dialog";

interface Props {
  storeId: string;
  currency: string;
  categories: ExpenseCategoryRow[];
  expense: ExpenseListRow;
}

export function ExpenseRowActions({ storeId, currency, categories, expense }: Props) {
  const t = useTranslations("admin");
  return (
    <div className="flex items-center justify-end gap-1">
      <ExpenseDialog
        storeId={storeId}
        currency={currency}
        categories={categories}
        expense={expense}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={t("common.edit")} title={t("common.edit")}>
            <Pencil />
          </Button>
        }
      />
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={t("common.delete")} title={t("common.delete")}>
            <Trash2 />
          </Button>
        }
        title={t("finance.deleteExpense")}
        description={t("finance.deleteExpenseHint")}
        confirmLabel={t("common.delete")}
        destructive
        action={() => {
          const fd = new FormData();
          fd.set("storeId", storeId);
          fd.set("id", expense.id);
          return deleteExpenseAction({}, fd);
        }}
      />
    </div>
  );
}
