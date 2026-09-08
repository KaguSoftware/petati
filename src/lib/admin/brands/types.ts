import type { BrandRow } from "@/lib/db/types";

/** One row of the admin brands table. */
export interface BrandAdminRow extends BrandRow {
  productCount: number;
}

/** Lightweight option list for the product form select. */
export interface BrandOption {
  id: string;
  name: string;
}
