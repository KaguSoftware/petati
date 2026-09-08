import type { Locale } from "@/i18n/config";
import type { Translated } from "@/lib/db/types";

/** Lightweight shape used by cards and grids. Everything already localised. */
export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  imageAlt: string;
  ratingAvg: number;
  ratingCount: number;
  inStock: boolean;
  isNew: boolean;
  isFeatured: boolean;
  /** brand name (localised names are not needed: brands are proper nouns) */
  brand: string | null;
}

export interface CategoryData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
}

export interface BrandData {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
}

export interface VariantData {
  id: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stockQty: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  isDefault: boolean;
  /** option value ids that make up this variant */
  optionValueIds: string[];
}

export interface OptionData {
  id: string;
  name: string;
  values: { id: string; label: string; swatch: string | null }[];
}

export interface ProductDetail extends ProductCardData {
  description: string | null;
  /** brand slug for the /b/<slug> link; null when the product has no brand */
  brandSlug: string | null;
  images: { url: string; alt: string }[];
  options: OptionData[];
  variants: VariantData[];
  categories: { slug: string; name: string }[];
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface ReviewData {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string;
  createdAt: string;
  isVerifiedPurchase: boolean;
}

export type ProductSort = "newest" | "price_asc" | "price_desc" | "rating";

export interface ProductListParams {
  /** a category slug; matches the category AND every descendant */
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  featuredOnly?: boolean;
}

export interface ProductListResult {
  items: ProductCardData[];
  total: number;
  page: number;
  pageSize: number;
}

export function pickTranslation<T extends { locale: Locale }>(
  rows: T[] | null | undefined,
  locale: Locale,
  fallback: Locale,
): T | undefined {
  if (!rows?.length) return undefined;
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === fallback) ?? rows[0];
}

export function pickJson(value: Translated | null | undefined, locale: Locale, fallback: Locale) {
  if (!value) return "";
  return value[locale] ?? value[fallback] ?? Object.values(value)[0] ?? "";
}
