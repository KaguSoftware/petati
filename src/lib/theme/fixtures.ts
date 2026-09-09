import type { CategoryData, ProductCardData, ProductDetail, ReviewData } from "@/lib/catalog/types";
import type { CartSummary } from "@/lib/cart/cart";
import type { FooterContent } from "./footer";
import type { ResolvedHeroSlide } from "./hero";

/**
 * Deterministic demo data for rendering storefront sections without a database: used by the
 * /preview route (dev) and later by the admin design picker's live preview.
 */
const img = (seed: string, w = 900, h = 900) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

/** A wide fixture photo for heroes when the store has none (full-bleed heroes crop square photos badly). */
export const fixtureHeroImage = img("petati-hero", 2400, 1000);

/** Complete contact/footer content so the design picker shows every footer layout filled in. */
export const fixtureFooterContent: FooterContent = {
  address: { en: "Bağdat Cd. No:123\nKadıköy, İstanbul", tr: "Bağdat Cd. No:123\nKadıköy, İstanbul", fa: "خیابان بغداد، پلاک ۱۲۳\nکادیکوی، استانبول" },
  hours: { en: "Mon–Sat 9:00–19:00\nSun closed", tr: "Pzt–Cmt 9:00–19:00\nPazar kapalı", fa: "دوشنبه تا شنبه ۹:۰۰ تا ۱۹:۰۰\nیکشنبه تعطیل" },
  social: { instagram: "https://instagram.com/petati", whatsapp: "https://wa.me/902125550000", telegram: "https://t.me/petati" },
  trustEnabled: true,
  trustItems: [],
  payments: ["visa", "mastercard", "troy", "cash_on_delivery"],
};
export const fixtureContactPhone = "+90 212 555 00 00";

/** Two slides for the dev harness, so every hero layout is exercised as a carousel (text of slide 1 comes from the `home` messages). */
export const fixtureHeroSlides: ResolvedHeroSlide[] = [
  { imageUrl: fixtureHeroImage, link: null },
  { title: "New arrivals every week", subtitle: "Fresh toys, treats and gear for cats and dogs.", imageUrl: img("petati-hero-2", 2400, 1000), link: "/shop?sort=newest" },
];

export const fixtureCategories: CategoryData[] = [
  { id: "c1", slug: "toys", name: "Toys", description: null, imageUrl: img("toys", 800, 600), parentId: null },
  { id: "c2", slug: "food", name: "Food & Treats", description: null, imageUrl: img("food", 800, 600), parentId: null },
  { id: "c3", slug: "beds", name: "Beds", description: null, imageUrl: img("beds", 800, 600), parentId: null },
  { id: "c4", slug: "collars", name: "Collars & Leashes", description: null, imageUrl: img("collars", 800, 600), parentId: null },
  { id: "c5", slug: "grooming", name: "Grooming", description: null, imageUrl: img("grooming", 800, 600), parentId: null },
  { id: "c6", slug: "dry-food", name: "Dry food", description: null, imageUrl: img("dry-food", 800, 600), parentId: "c2" },
  { id: "c7", slug: "wet-food", name: "Wet food", description: null, imageUrl: img("wet-food", 800, 600), parentId: "c2" },
];
/** Top-level categories only (banner, footer). */
export const fixtureTopCategories = fixtureCategories.filter((c) => !c.parentId);

const brands = ["Petati", "Royal Canin", null, "Gourmet"];

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
  brand: brands[i % brands.length],
}));

export const fixtureProduct: ProductDetail = {
  ...fixtureProducts[6],
  description:
    "Made from durable, pet-safe materials. Designed for everyday use and easy cleaning.\n\nMachine washable cover, non-slip base, and a supportive memory-foam core for older joints.",
  brand: "Royal Canin",
  brandSlug: "royal-canin",
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
