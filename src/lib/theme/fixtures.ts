import type { CategoryData, ProductCardData, ProductDetail, ReviewData } from "@/lib/catalog/types";
import type { CartSummary } from "@/lib/cart/cart";

/**
 * Deterministic demo data for rendering storefront sections without a database: used by the
 * /preview route (dev) and later by the admin design picker's live preview.
 */
const img = (seed: string, w = 900, h = 900) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const fixtureCategories: CategoryData[] = [
  { id: "c1", slug: "toys", name: "Toys", description: null, imageUrl: img("toys", 800, 600), parentId: null },
  { id: "c2", slug: "food", name: "Food & Treats", description: null, imageUrl: img("food", 800, 600), parentId: null },
  { id: "c3", slug: "beds", name: "Beds", description: null, imageUrl: img("beds", 800, 600), parentId: null },
  { id: "c4", slug: "collars", name: "Collars & Leashes", description: null, imageUrl: img("collars", 800, 600), parentId: null },
  { id: "c5", slug: "grooming", name: "Grooming", description: null, imageUrl: img("grooming", 800, 600), parentId: null },
];

const names = [
  "Rope Tug Toy", "Squeaky Duck", "Feather Wand", "Treat Puzzle Ball",
  "Salmon Dog Kibble", "Chicken Cat Kibble", "Orthopedic Dog Bed", "Donut Cat Bed",
];

export const fixtureProducts: ProductCardData[] = names.map((name, i) => ({
  id: `p${i + 1}`,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
  shortDescription: `Quality ${name.toLowerCase()} your pet will love.`,
  price: 9900 + i * 7000,
  compareAtPrice: i % 3 === 0 ? 9900 + i * 7000 + 8000 : null,
  imageUrl: img(`${name}-1`),
  imageAlt: name,
  ratingAvg: i % 2 === 0 ? 4.5 : 0,
  ratingCount: i % 2 === 0 ? 12 : 0,
  inStock: i !== 5,
  isNew: i % 3 === 1,
  isFeatured: i < 4,
}));

export const fixtureProduct: ProductDetail = {
  ...fixtureProducts[6],
  description:
    "Made from durable, pet-safe materials. Designed for everyday use and easy cleaning.\n\nMachine washable cover, non-slip base, and a supportive memory-foam core for older joints.",
  brand: "Petati",
  images: [1, 2, 3].map((n) => ({ url: img(`Orthopedic Dog Bed-${n}`), alt: "Orthopedic Dog Bed" })),
  options: [
    {
      id: "o1",
      name: "Size",
      values: [
        { id: "v-s", label: "Small", swatch: null },
        { id: "v-m", label: "Medium", swatch: null },
        { id: "v-l", label: "Large", swatch: null },
      ],
    },
  ],
  variants: [
    { id: "00000000-0000-4000-8000-000000000001", sku: "BED-S", price: 89900, compareAtPrice: 97900, stockQty: 8, trackInventory: true, allowBackorder: false, isDefault: true, optionValueIds: ["v-s"] },
    { id: "00000000-0000-4000-8000-000000000002", sku: "BED-M", price: 94900, compareAtPrice: null, stockQty: 3, trackInventory: true, allowBackorder: false, isDefault: false, optionValueIds: ["v-m"] },
    { id: "00000000-0000-4000-8000-000000000003", sku: "BED-L", price: 99900, compareAtPrice: null, stockQty: 0, trackInventory: true, allowBackorder: false, isDefault: false, optionValueIds: ["v-l"] },
  ],
  categories: [{ slug: "beds", name: "Beds" }],
  seoTitle: null,
  seoDescription: null,
};

export const fixtureReviews: ReviewData[] = [
  { id: "r1", rating: 5, title: "Great quality", body: "My dog has not left it since it arrived.", authorName: "Cem", createdAt: "2026-08-20T10:00:00Z", isVerifiedPurchase: true },
  { id: "r2", rating: 4, title: null, body: "Comfortable and easy to wash. Slightly smaller than expected.", authorName: "Sara", createdAt: "2026-08-02T10:00:00Z", isVerifiedPurchase: false },
];

export const fixtureCart: CartSummary = {
  id: "cart-1",
  token: "t",
  currency: "TRY",
  lines: [
    { id: "l1", variantId: "v1", productId: "p7", productSlug: "orthopedic-dog-bed", name: "Orthopedic Dog Bed", variantLabel: "Medium", sku: "BED-M", imageUrl: img("Orthopedic Dog Bed-1"), unitPrice: 94900, unitCost: 42000, quantity: 1, lineTotal: 94900, maxQty: 3 },
    { id: "l2", variantId: "v2", productId: "p1", productSlug: "rope-tug-toy", name: "Rope Tug Toy", variantLabel: null, sku: "ROPE", imageUrl: img("Rope Tug Toy-1"), unitPrice: 14900, unitCost: 6000, quantity: 2, lineTotal: 29800, maxQty: null },
  ],
  itemCount: 3,
  subtotal: 124700,
  coupon: null,
};
