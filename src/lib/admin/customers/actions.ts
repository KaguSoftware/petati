"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { adminMutation, actionError } from "@/lib/admin/guard";
import type { ActionState } from "@/lib/admin/types";
import { boolField, optionalText, parseForm, uuidField } from "@/lib/admin/validate";

// SCOPE(customers): no delete/merge; GROWS LATER → GDPR export/delete.

const schema = z.object({
  storeId: uuidField,
  customerId: uuidField,
  full_name: optionalText(120),
  /** Free text (customers.phone has no E.164 constraint); kept Latin/LTR by the input. */
  phone: optionalText(40),
  accepts_marketing: boolField,
  notes: optionalText(2000),
});

export async function updateCustomerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(schema, formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, customerId, full_name, phone, accepts_marketing, notes } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "customers.write");
    const { data, error } = await db
      .from("customers")
      .update({ full_name, phone: phone?.replace(/\s+/g, " ") ?? null, accepts_marketing, notes })
      .eq("store_id", storeId)
      .eq("id", customerId)
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error) throw error;
    if (!data) return { error: "notFound" };
    refresh();
    return { ok: true, id: data.id };
  } catch (err) {
    return { error: actionError(err) };
  }
}
