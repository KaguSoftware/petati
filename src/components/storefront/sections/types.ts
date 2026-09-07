import type { ReactNode } from "react";
import type { CategoryData, ProductCardData, ProductDetail, ReviewData } from "@/lib/catalog/types";
import type { CartSummary } from "@/lib/cart/cart";
import type { Totals } from "@/lib/checkout/totals";
import type { VariantKey } from "@/lib/theme/types";

/**
 * Props contract for every storefront section. All four variants of a section receive exactly
 * these props, so the admin can swap variants freely. Interactive bits (cart button, add-to-cart
 * panel, forms) arrive as ready-made ReactNode slots; variants only decide layout and styling.
 */

export interface AnnouncementBarProps {
  text: string;
}

export interface NavbarProps {
  storeName: string;
  logoUrl: string | null;
  categories: Pick<CategoryData, "slug" | "name">[];
  labels: { home: string; shop: string; search: string; menu: string };
  /** dynamic slots rendered by the page inside Suspense */
  cartSlot: ReactNode;
  accountSlot: ReactNode;
  localeSlot: ReactNode;
}

export interface HeroProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
}

export interface CategoryBannerProps {
  title: string;
  categories: CategoryData[];
}

export interface ProductGridProps {
  title?: string;
  products: ProductCardData[];
  currency: string;
  locale: string;
  cardVariant: VariantKey;
  emptyLabel: string;
  /** product id → wishlist toggle node (only when signed in) */
  wishlistSlots?: Record<string, ReactNode>;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export interface ProductCardProps {
  product: ProductCardData;
  currency: string;
  locale: string;
  labels: { new: string; outOfStock: string };
  wishlistSlot?: ReactNode;
}

export interface ProductPageProps {
  product: ProductDetail;
  currency: string;
  locale: string;
  labels: { description: string; sku: string; reviews: string; inStock: string; outOfStock: string };
  purchasePanel: ReactNode;
  reviewsSection: ReactNode;
  wishlistSlot?: ReactNode;
}

export interface CartViewProps {
  cart: CartSummary;
  totals: Totals;
  currency: string;
  locale: string;
  labels: {
    title: string;
    empty: string;
    subtotal: string;
    discount: string;
    shipping: string;
    tax: string;
    total: string;
    checkout: string;
    continueShopping: string;
    freeShipping: string;
    /** hint under the shipping row, e.g. "Free shipping on orders over X" */
    shippingNote: string | null;
  };
  /** cart line id → quantity controls node */
  lineControls: Record<string, ReactNode>;
  couponSlot: ReactNode;
  checkoutHref: string;
  shopHref: string;
}

export interface CheckoutLayoutProps {
  title: string;
  form: ReactNode;
  summary: ReactNode;
}

export interface ReviewsProps {
  reviews: ReviewData[];
  ratingAvg: number;
  ratingCount: number;
  locale: string;
  labels: { title: string; empty: string; verified: string };
  formSlot: ReactNode | null;
}

export interface NewsletterProps {
  title: string;
  subtitle: string;
  formSlot: ReactNode;
}

export interface FooterProps {
  storeName: string;
  tagline: string | null;
  categories: Pick<CategoryData, "slug" | "name">[];
  contactEmail: string | null;
  contactPhone: string | null;
  labels: { categories: string; contact: string; rights: string; about: string; privacy: string; terms: string };
  localeSlot: ReactNode;
  year: number;
}

export interface SectionProps {
  announcementBar: AnnouncementBarProps;
  navbar: NavbarProps;
  hero: HeroProps;
  categoryBanner: CategoryBannerProps;
  productGrid: ProductGridProps;
  productCard: ProductCardProps;
  productPage: ProductPageProps;
  cartDrawer: CartViewProps;
  checkout: CheckoutLayoutProps;
  reviews: ReviewsProps;
  newsletter: NewsletterProps;
  footer: FooterProps;
}
