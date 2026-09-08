import type { Locale } from "@/i18n/config";
import type { StoreDomainRow } from "@/lib/db/types";

/** One row of the admin stores list. */
export interface StoreListItem {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  currency: string;
  default_locale: Locale;
  enabled_locales: Locale[];
  is_active: boolean;
  created_at: string;
  /** Primary first, then by hostname. */
  domains: StoreDomainRow[];
}

/** Result of the live slug / hostname availability checks in the wizard. */
export type AvailabilityResult = { ok: true } | { error: "invalid" | "reserved" | "taken" | "rootDomain" };
