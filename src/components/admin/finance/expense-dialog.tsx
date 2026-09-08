"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveExpenseAction } from "@/lib/admin/finance/actions";
import type { ExpenseCategoryRow, ExpenseListRow } from "@/lib/admin/finance/types";
import { DatePicker } from "../shared/date-picker";
import { FormField } from "../shared/form-field";
import { MoneyInput } from "../shared/money-input";
import { useActionToast } from "../shared/use-action-toast";
import { ReceiptUploader } from "./receipt-uploader";

interface Props {
  storeId: string;
  currency: string;
  categories: ExpenseCategoryRow[];
  /** When set, the dialog edits this expense; otherwise it creates one. */
  expense?: ExpenseListRow;
  /** Element that opens the dialog (rendered via Base UI `render`). */
  trigger: ReactElement;
}

const NONE = "none";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Create / edit expense dialog. Only custom controls: MoneyInput, DatePicker, Select, uploader. */
export function ExpenseDialog({ storeId, currency, categories, expense, trigger }: Props) {
  const t = useTranslations("admin.finance");
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? t("editExpense") : t("addExpense")}</DialogTitle>
          <DialogDescription>{t("form.description")}</DialogDescription>
        </DialogHeader>
        <ExpenseForm storeId={storeId} currency={currency} categories={categories} expense={expense} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Mounted only while the dialog is open. The row is snapshotted on mount so the uncontrolled
 * defaults do not change when the router refresh delivers the saved row before the dialog closes.
 */
function ExpenseForm({ storeId, currency, categories, expense, onDone }: Omit<Props, "trigger"> & { onDone: () => void }) {
  const t = useTranslations("admin.finance");
  const tc = useTranslations("admin.common");
  const [initial] = useState(() => expense);
  const [state, action, pending] = useActionToast(saveExpenseAction, { errorNamespace: "admin.finance", onSuccess: onDone });
  const items = [{ value: NONE, label: t("form.noCategory") }, ...categories.map((c) => ({ value: c.id, label: c.name }))];

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="storeId" value={storeId} />
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="amount" label={t("form.amount")} errors={state.fieldErrors} required>
          <MoneyInput id="amount" name="amount" currency={currency} defaultValue={initial?.amount} required />
        </FormField>
        <FormField name="spent_on" label={t("form.date")} errors={state.fieldErrors} required>
          <DatePicker id="spent_on" name="spent_on" defaultValue={initial?.spent_on ?? todayIso()} required />
        </FormField>
      </div>

      <FormField name="category_id" label={t("form.category")} errors={state.fieldErrors}>
        <Select name="category_id" defaultValue={initial?.category_id ?? NONE} items={items}>
          <SelectTrigger id="category_id" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField name="vendor" label={t("form.vendor")} errors={state.fieldErrors}>
        <Input id="vendor" name="vendor" defaultValue={initial?.vendor ?? ""} maxLength={120} placeholder={t("form.vendorPlaceholder")} dir="auto" />
      </FormField>

      <FormField name="note" label={t("form.note")} errors={state.fieldErrors}>
        <Textarea id="note" name="note" rows={2} defaultValue={initial?.note ?? ""} maxLength={1000} placeholder={t("form.notePlaceholder")} dir="auto" />
      </FormField>

      <FormField name="receipt_url" label={t("form.receipt")} description={t("form.receiptHint")} errors={state.fieldErrors}>
        <ReceiptUploader storeId={storeId} defaultValue={initial?.receipt_url} />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          {tc("cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? tc("saving") : tc("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
