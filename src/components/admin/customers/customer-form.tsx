"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LatinInput } from "@/components/forms/latin-input";
import { updateCustomerAction } from "@/lib/admin/customers/actions";
import type { ActionState } from "@/lib/admin/types";
import type { CustomerRow } from "@/lib/db/types";
import { FormField } from "../shared/form-field";

interface Props {
  storeId: string;
  customer: Pick<CustomerRow, "id" | "full_name" | "phone" | "accepts_marketing" | "notes">;
  /** Staff can read customers but not edit them. */
  readOnly?: boolean;
}

/**
 * The page keys this form on `updated_at`, so a successful save remounts it with fresh defaults.
 * The toast is therefore fired right after the action instead of from an effect on the old instance.
 */
export function CustomerForm({ storeId, customer, readOnly = false }: Props) {
  const t = useTranslations("admin.customers");
  const tc = useTranslations("admin.common");
  const [state, setState] = useState<ActionState>({});
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    start(async () => {
      const res = await updateCustomerAction({}, formData);
      setState(res);
      if (res.error) toast.error(tc.has(`errors.${res.error}`) ? tc(`errors.${res.error}`) : res.error);
      else toast.success(tc("saved"));
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-4">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="customerId" value={customer.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="full_name" label={t("fullName")} errors={state.fieldErrors}>
          <Input id="full_name" name="full_name" defaultValue={customer.full_name ?? ""} maxLength={120} disabled={readOnly} autoComplete="off" />
        </FormField>
        <FormField name="phone" label={t("phone")} errors={state.fieldErrors}>
          <LatinInput kind="tel" id="phone" name="phone" defaultValue={customer.phone ?? ""} maxLength={40} disabled={readOnly} autoComplete="off" />
        </FormField>
      </div>
      <Field orientation="horizontal" className="rounded-lg border p-3">
        <FieldContent>
          <FieldLabel htmlFor="accepts_marketing">{t("acceptsMarketing")}</FieldLabel>
          <FieldDescription>{t("marketing")}</FieldDescription>
        </FieldContent>
        <Switch id="accepts_marketing" name="accepts_marketing" defaultChecked={customer.accepts_marketing} disabled={readOnly} />
      </Field>
      <FormField name="notes" label={t("notes")} errors={state.fieldErrors}>
        <Textarea id="notes" name="notes" defaultValue={customer.notes ?? ""} rows={4} maxLength={2000} placeholder={t("notesPlaceholder")} disabled={readOnly} />
      </FormField>
      {readOnly ? (
        <p className="text-xs text-muted-foreground">{t("readOnly")}</p>
      ) : (
        <Button type="submit" className="self-end" disabled={pending}>
          {pending ? tc("saving") : tc("save")}
        </Button>
      )}
    </form>
  );
}
