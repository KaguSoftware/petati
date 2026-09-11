import type { LookupMatch } from "@/lib/admin/delivery/queries";
import type { ProductStatus } from "@/lib/db/types";

export type SearchKind = "orders" | "customers" | "products" | "couriers";
export const SEARCH_KINDS: readonly SearchKind[] = ["orders", "customers", "products", "couriers"];

export interface CustomerHit {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

export interface ProductHit {
  id: string;
  name: string;
  sku: string | null;
  status: ProductStatus;
  thumbnail: string | null;
}

export interface CourierHit {
  id: string;
  name: string;
  phone: string | null;
  isActive: boolean;
}

export interface GlobalSearchResult {
  query: string;
  /** A group the role may not see is simply absent. */
  orders?: LookupMatch[];
  customers?: CustomerHit[];
  products?: ProductHit[];
  couriers?: CourierHit[];
}
