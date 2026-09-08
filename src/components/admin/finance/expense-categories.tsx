"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { deleteExpenseCategoryAction, saveExpenseCategoryAction } from "@/lib/admin/finance/actions";
import type { ExpenseCategoryRow } from "@/lib/admin/finance/types";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { FormField } from "../shared/form-field";
import { NumberInput } from "../shared/number-input";
import { useActionToast } from "../shared/use-action-toast";

interface Props {
  storeId: string;
  categories: ExpenseCategoryRow[];
}

/** Inline list of expense categories with add / rename / delete dialogs. */
export function ExpenseCategories({ storeId, categories }: Props) {
  const t = useTranslations("admin.finance.categories");
  const tc = useTranslations("admin.common");
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <h2 className="text-sm font-medium">{t("title")}</h2>
          <p className="text-xs text-muted-foreground">{t("hint")}</p>
        </div>
        <CategoryDialog
          storeId={storeId}
          nextSort={categories.length}
          trigger={
            <Button variant="outline" size="sm">
              <Plus data-icon="inline-start" />
              {t("add")}
            </Button>
          }
        />
      </div>
      {categories.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-1.5 text-sm">
              <span className="w-6 shrink-0 text-xs text-muted-foreground tabular-nums">{c.sort_order}</span>
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              <CategoryDialog
                storeId={storeId}
                category={c}
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label={tc("edit")} title={tc("edit")}>
                    <Pencil />
                  </Button>
                }
              />
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={tc("delete")} title={tc("delete")}>
                    <Trash2 />
                  </Button>
                }
                title={t("delete", { name: c.name })}
                description={t("deleteHint")}
                confirmLabel={tc("delete")}
                destructive
                action={() => {
                  const fd = new FormData();
                  fd.set("storeId", storeId);
                  fd.set("id", c.id);
                  return deleteExpenseCategoryAction({}, fd);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CategoryDialog({ storeId, category, nextSort = 0, trigger }: { storeId: string; category?: ExpenseCategoryRow; nextSort?: number; trigger: ReactElement }) {
  const t = useTranslations("admin.finance.categories");
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? t("edit") : t("add")}</DialogTitle>
          <DialogDescription>{t("hint")}</DialogDescription>
        </DialogHeader>
        <CategoryForm storeId={storeId} category={category} nextSort={nextSort} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

/** Mounted only while the dialog is open, so the uncontrolled defaults are captured once per opening. */
function CategoryForm({ storeId, category, nextSort, onDone }: { storeId: string; category?: ExpenseCategoryRow; nextSort: number; onDone: () => void }) {
  const t = useTranslations("admin.finance.categories");
  const tc = useTranslations("admin.common");
  const [initial] = useState(() => ({ id: category?.id, name: category?.name ?? "", sort: category?.sort_order ?? nextSort }));
  const [state, action, pending] = useActionToast(saveExpenseCategoryAction, { errorNamespace: "admin.finance", onSuccess: onDone });
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="storeId" value={storeId} />
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <FormField name="name" label={t("name")} errors={state.fieldErrors} required>
        <Input id="name" name="name" defaultValue={initial.name} maxLength={80} required autoFocus dir="auto" />
      </FormField>
      <FormField name="sort_order" label={t("sortOrder")} errors={state.fieldErrors}>
        <NumberInput id="sort_order" name="sort_order" defaultValue={initial.sort} min={0} max={9999} className="w-36" />
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
