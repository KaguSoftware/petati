import { createElement, type ComponentType, type ReactElement } from "react";
import type { SectionKey, VariantKey } from "./types";
import type { SectionProps } from "@/components/storefront/sections/types";
import { AnnouncementBarMinimal } from "@/components/storefront/sections/announcement-bar/minimal";
import { NavbarMinimal } from "@/components/storefront/sections/navbar/minimal";
import { HeroMinimal } from "@/components/storefront/sections/hero/minimal";
import { CategoryBannerMinimal } from "@/components/storefront/sections/category-banner/minimal";
import { ProductGridMinimal } from "@/components/storefront/sections/product-grid/minimal";
import { ProductCardMinimal } from "@/components/storefront/sections/product-card/minimal";
import { ProductPageMinimal } from "@/components/storefront/sections/product-page/minimal";
import { CartViewMinimal } from "@/components/storefront/sections/cart-drawer/minimal";
import { CheckoutMinimal } from "@/components/storefront/sections/checkout/minimal";
import { ReviewsMinimal } from "@/components/storefront/sections/reviews/minimal";
import { NewsletterMinimal } from "@/components/storefront/sections/newsletter/minimal";
import { FooterMinimal } from "@/components/storefront/sections/footer/minimal";

type Registry = {
  [K in SectionKey]: Partial<Record<VariantKey, ComponentType<SectionProps[K]>>> & {
    minimal: ComponentType<SectionProps[K]>;
  };
};

/**
 * section → variant → component. `minimal` is mandatory and is the fallback for any variant that
 * is not implemented yet.
 * SCOPE(themes): only `minimal` exists. GROWS LATER (step 6) → bold, editorial, playful per section.
 */
export const registry: Registry = {
  announcementBar: { minimal: AnnouncementBarMinimal },
  navbar: { minimal: NavbarMinimal },
  hero: { minimal: HeroMinimal },
  categoryBanner: { minimal: CategoryBannerMinimal },
  productGrid: { minimal: ProductGridMinimal },
  productCard: { minimal: ProductCardMinimal },
  productPage: { minimal: ProductPageMinimal },
  cartDrawer: { minimal: CartViewMinimal },
  checkout: { minimal: CheckoutMinimal },
  reviews: { minimal: ReviewsMinimal },
  newsletter: { minimal: NewsletterMinimal },
  footer: { minimal: FooterMinimal },
};

export function getSection<K extends SectionKey>(key: K, variant: VariantKey): ComponentType<SectionProps[K]> {
  return (registry[key][variant] ?? registry[key].minimal) as ComponentType<SectionProps[K]>;
}

/** Which variants are actually implemented for a section (drives the admin design picker). */
export function availableVariants(key: SectionKey): VariantKey[] {
  return Object.keys(registry[key]) as VariantKey[];
}

/**
 * Render a section in the chosen variant. Using createElement keeps the React Compiler lint rule
 * happy (no components created during render) and hides the registry lookup from call sites.
 */
export function renderSection<K extends SectionKey>(key: K, variant: VariantKey, props: SectionProps[K]): ReactElement {
  return createElement(getSection(key, variant), props);
}
