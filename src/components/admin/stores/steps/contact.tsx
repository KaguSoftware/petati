"use client";

import { useTranslations } from "next-intl";
import { FormField } from "@/components/admin/shared/form-field";
import { LatinInput } from "@/components/forms/latin-input";
import { Input } from "@/components/ui/input";
import type { StepProps } from "./types";

export function ContactStep({ draft, update, errors }: StepProps) {
  const t = useTranslations("stores.contact");
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <FormField name="contactEmail" label={t("email")} errors={errors} description={t("emailHint")}>
        <LatinInput kind="email" id="contactEmail" value={draft.contactEmail ?? ""} maxLength={200} onChange={(e) => update({ contactEmail: e.target.value })} />
      </FormField>
      <FormField name="contactPhone" label={t("phone")} errors={errors}>
        <LatinInput kind="tel" id="contactPhone" value={draft.contactPhone ?? ""} maxLength={40} onChange={(e) => update({ contactPhone: e.target.value })} />
      </FormField>
      <FormField name="emailFrom" label={t("emailFrom")} errors={errors} description={t("emailFromHint")} className="md:col-span-2">
        <Input id="emailFrom" dir="ltr" value={draft.emailFrom ?? ""} maxLength={200} placeholder="Store <noreply@example.com>" autoCapitalize="none" onChange={(e) => update({ emailFrom: e.target.value })} />
      </FormField>
    </div>
  );
}
