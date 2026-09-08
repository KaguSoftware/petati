"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { actionError, adminMutation, assertExpenseInStore } from "@/lib/admin/guard";
import type { ActionState } from "@/lib/admin/types";
import { dateField, intField, moneyField, optionalText, parseForm, uuidField } from "@/lib/admin/validate";

// SCOPE(finance): CSV export (finance.export) GROWS LATER → route handler streaming v_daily_sales/expenses.

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalId = z.preprocess(blankToUndefined, uuidField.optional());
/** The category Select submits "none" for the empty choice. */
const optionalCategory = z.preprocess((v) => (v === "none" || (typeof v === "string" && v.trim() === "") ? null : v), uuidField.nullable());
const optionalUrl = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.url({ message: "invalid" }).max(1000).nullable());

const base = z.object({ storeId: uuidField, id: optionalId });

export async function saveExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const pre = parseForm(base, formData);
  if (!pre.data) return { error: "invalid", fieldErrors: pre.fieldErrors };
  const { storeId, id } = pre.data;
  try {
    const { db, user } = await adminMutation(storeId, "finance.write");
    const { data: store } = await db.from("stores").select("currency").eq("id", storeId).maybeSingle<{ currency: string }>();
    if (!store) return { error: "notFound" };

    const parsed = parseForm(
      z.object({
        amount: moneyField(store.currency, { min: 1 }),
        spent_on: dateField,
        category_id: optionalCategory,
        vendor: optionalText(120),
        note: optionalText(1000),
        receipt_url: optionalUrl,
      }),
      formData,
    );
    if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
    const { category_id, ...rest } = parsed.data;

    if (category_id) {
      const { data: cat } = await db.from("expense_categories").select("id").eq("id", category_id).eq("store_id", storeId).maybeSingle<{ id: string }>();
      if (!cat) return { error: "invalid", fieldErrors: { category_id: "invalid" } };
    }
    const row = { ...rest, category_id, currency: store.currency };

    if (id) {
      await assertExpenseInStore(db, id, storeId);
      const { error } = await db.from("expenses").update(row).eq("id", id).eq("store_id", storeId);
      if (error) throw error;
      refresh();
      return { ok: true, id };
    }
    const { data, error } = await db.from("expenses").insert({ ...row, store_id: storeId, created_by: user.id }).select("id").single<{ id: string }>();
    if (error) throw error;
    refresh();
    return { ok: true, id: data.id };
  } catch (err) {
    return { error: actionError(err) };
  }
}

export async function deleteExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(z.object({ storeId: uuidField, id: uuidField }), formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, id } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "finance.write");
    await assertExpenseInStore(db, id, storeId);
    const { error } = await db.from("expenses").delete().eq("id", id).eq("store_id", storeId);
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

export async function saveExpenseCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(
    base.extend({
      name: z.string({ message: "required" }).trim().min(1, "required").max(80, "invalid"),
      sort_order: intField({ min: 0, max: 9999 }),
    }),
    formData,
  );
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, id, name, sort_order } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "finance.write");
    if (id) {
      const { error } = await db.from("expense_categories").update({ name, sort_order }).eq("id", id).eq("store_id", storeId);
      if (error) throw error;
      refresh();
      return { ok: true, id };
    }
    const { data, error } = await db.from("expense_categories").insert({ store_id: storeId, name, sort_order }).select("id").single<{ id: string }>();
    if (error) throw error;
    refresh();
    return { ok: true, id: data.id };
  } catch (err) {
    const key = actionError(err);
    if (key === "unique") return { error: "invalid", fieldErrors: { name: "unique" } };
    return { error: key };
  }
}

/** Deleting a category keeps its expenses (FK `on delete set null`). */
export async function deleteExpenseCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(z.object({ storeId: uuidField, id: uuidField }), formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, id } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "finance.write");
    const { error } = await db.from("expense_categories").delete().eq("id", id).eq("store_id", storeId);
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}
