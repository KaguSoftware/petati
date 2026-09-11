import { z } from "zod";
import { locales } from "@/i18n/config";
import type { LocaleText } from "@/lib/theme/hero";
import { DELIVERY_ATTEMPT_LIMIT } from "./limits";

/**
 * Delivery settings kept in `stores.settings` (`delivery_slots`, `delivery_attempt_limit`, …).
 * Isomorphic like `theme/footer.ts`: a tolerant reader for every render path, a zod input schema for
 * the admin action, and a writer that produces exactly the keys to merge back.
 *
 * Edited under Admin → Settings → Delivery.
 */
export interface DeliverySlot {
  /** Stable key stored on the delivery row. */
  key: string;
  label: LocaleText;
  from: string;
  to: string;
}

export interface DeliverySettings {
  slots: DeliverySlot[];
  /** Wrong code entries before the customer's code locks. */
  attemptLimit: number;
  /** Cash-on-delivery columns and fields, on the board and on the courier's phone. */
  codEnabled: boolean;
  /** Days ahead the dispatch board schedules by default. */
  leadDays: number;
}

export const MAX_SLOTS = 6;

export const DEFAULT_DELIVERY: DeliverySettings = {
  slots: [],
  attemptLimit: DELIVERY_ATTEMPT_LIMIT,
  codEnabled: true,
  leadDays: 1,
};

const localeEnum = z.enum(locales);
const localeText = z.partialRecord(localeEnum, z.string().trim().max(60)).optional();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const deliveryInputSchema = z.object({
  slots: z
    .array(z.object({ key: z.string().trim().min(1).max(24), label: localeText, from: time, to: time }))
    .max(MAX_SLOTS)
    .optional(),
  attemptLimit: z.number().int().min(1).max(20).optional(),
  codEnabled: z.boolean().optional(),
  leadDays: z.number().int().min(0).max(14).optional(),
});
export type DeliveryInput = z.infer<typeof deliveryInputSchema>;

function readSlots(value: unknown): DeliverySlot[] {
  if (!Array.isArray(value)) return [];
  const out: DeliverySlot[] = [];
  for (const raw of value.slice(0, MAX_SLOTS)) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.key !== "string" || !r.key.trim()) continue;
    const label: LocaleText = {};
    if (r.label && typeof r.label === "object") {
      for (const [k, v] of Object.entries(r.label as Record<string, unknown>)) {
        if ((locales as readonly string[]).includes(k) && typeof v === "string") label[k as keyof LocaleText] = v;
      }
    }
    out.push({
      key: r.key.trim().slice(0, 24),
      label,
      from: typeof r.from === "string" ? r.from : "",
      to: typeof r.to === "string" ? r.to : "",
    });
  }
  return out;
}

function readInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? Math.trunc(n) : fallback;
}

/** Tolerant read: a store that has never opened the Delivery tab gets sane defaults. */
export function deliveryFromSettings(settings: Record<string, unknown> | null | undefined): DeliverySettings {
  const s = settings ?? {};
  return {
    slots: readSlots(s.delivery_slots),
    attemptLimit: readInt(s.delivery_attempt_limit, DEFAULT_DELIVERY.attemptLimit, 1, 20),
    codEnabled: s.delivery_cod_enabled === undefined ? DEFAULT_DELIVERY.codEnabled : Boolean(s.delivery_cod_enabled),
    leadDays: readInt(s.delivery_lead_days, DEFAULT_DELIVERY.leadDays, 0, 14),
  };
}

export function deliveryFromInput(input: DeliveryInput): DeliverySettings {
  return {
    slots: (input.slots ?? []).map((s) => ({ key: s.key, label: s.label ?? {}, from: s.from, to: s.to })),
    attemptLimit: input.attemptLimit ?? DEFAULT_DELIVERY.attemptLimit,
    codEnabled: input.codEnabled ?? DEFAULT_DELIVERY.codEnabled,
    leadDays: input.leadDays ?? DEFAULT_DELIVERY.leadDays,
  };
}

/** The keys to spread over `stores.settings`. */
export function deliveryToSettings(d: DeliverySettings): Record<string, unknown> {
  return {
    delivery_slots: d.slots,
    delivery_attempt_limit: d.attemptLimit,
    delivery_cod_enabled: d.codEnabled,
    delivery_lead_days: d.leadDays,
  };
}

/** Slot label in the reader's language, falling back to the store default and then the raw key. */
export function slotLabel(slot: DeliverySlot, locale: string, fallback: string): string {
  const text = slot.label[locale as keyof LocaleText] ?? slot.label[fallback as keyof LocaleText];
  const window = slot.from && slot.to ? `${slot.from}–${slot.to}` : "";
  return text ? (window ? `${text} · ${window}` : text) : window || slot.key;
}
