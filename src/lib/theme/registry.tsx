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
import { AnnouncementBarBold } from "@/components/storefront/sections/announcement-bar/bold";
import { AnnouncementBarEditorial } from "@/components/storefront/sections/announcement-bar/editorial";
import { AnnouncementBarPlayful } from "@/components/storefront/sections/announcement-bar/playful";
import { NavbarBold } from "@/components/storefront/sections/navbar/bold";
import { NavbarEditorial } from "@/components/storefront/sections/navbar/editorial";
import { NavbarPlayful } from "@/components/storefront/sections/navbar/playful";
import { HeroBold } from "@/components/storefront/sections/hero/bold";
import { HeroEditorial } from "@/components/storefront/sections/hero/editorial";
import { HeroPlayful } from "@/components/storefront/sections/hero/playful";
import { CategoryBannerBold } from "@/components/storefront/sections/category-banner/bold";
import { CategoryBannerEditorial } from "@/components/storefront/sections/category-banner/editorial";
import { CategoryBannerPlayful } from "@/components/storefront/sections/category-banner/playful";
import { ProductGridBold } from "@/components/storefront/sections/product-grid/bold";
import { ProductGridEditorial } from "@/components/storefront/sections/product-grid/editorial";
import { ProductGridPlayful } from "@/components/storefront/sections/product-grid/playful";
import { ProductCardBold } from "@/components/storefront/sections/product-card/bold";
import { ProductCardEditorial } from "@/components/storefront/sections/product-card/editorial";
import { ProductCardPlayful } from "@/components/storefront/sections/product-card/playful";
import { ProductPageBold } from "@/components/storefront/sections/product-page/bold";
import { ProductPageEditorial } from "@/components/storefront/sections/product-page/editorial";
import { ProductPagePlayful } from "@/components/storefront/sections/product-page/playful";
import { CartViewBold } from "@/components/storefront/sections/cart-drawer/bold";
import { CartViewEditorial } from "@/components/storefront/sections/cart-drawer/editorial";
import { CartViewPlayful } from "@/components/storefront/sections/cart-drawer/playful";
import { CheckoutBold } from "@/components/storefront/sections/checkout/bold";
import { CheckoutEditorial } from "@/components/storefront/sections/checkout/editorial";
import { CheckoutPlayful } from "@/components/storefront/sections/checkout/playful";
import { ReviewsBold } from "@/components/storefront/sections/reviews/bold";
import { ReviewsEditorial } from "@/components/storefront/sections/reviews/editorial";
import { ReviewsPlayful } from "@/components/storefront/sections/reviews/playful";
import { NewsletterBold } from "@/components/storefront/sections/newsletter/bold";
import { NewsletterEditorial } from "@/components/storefront/sections/newsletter/editorial";
import { NewsletterPlayful } from "@/components/storefront/sections/newsletter/playful";
import { FooterBold } from "@/components/storefront/sections/footer/bold";
import { FooterEditorial } from "@/components/storefront/sections/footer/editorial";
import { FooterPlayful } from "@/components/storefront/sections/footer/playful";

type Registry = {
  [K in SectionKey]: Partial<Record<VariantKey, ComponentType<SectionProps[K]>>> & {
    minimal: ComponentType<SectionProps[K]>;
  };
};

/**
 * section → variant → component. `minimal` is mandatory and is the fallback for any variant that
 * is not implemented yet.
 * All four variants exist for every section (themes A–D, 2026-09-08).
 */
export const registry: Registry = {
  announcementBar: { minimal: AnnouncementBarMinimal, bold: AnnouncementBarBold, editorial: AnnouncementBarEditorial, playful: AnnouncementBarPlayful },
  navbar: { minimal: NavbarMinimal, bold: NavbarBold, editorial: NavbarEditorial, playful: NavbarPlayful },
  hero: { minimal: HeroMinimal, bold: HeroBold, editorial: HeroEditorial, playful: HeroPlayful },
  categoryBanner: { minimal: CategoryBannerMinimal, bold: CategoryBannerBold, editorial: CategoryBannerEditorial, playful: CategoryBannerPlayful },
  productGrid: { minimal: ProductGridMinimal, bold: ProductGridBold, editorial: ProductGridEditorial, playful: ProductGridPlayful },
  productCard: { minimal: ProductCardMinimal, bold: ProductCardBold, editorial: ProductCardEditorial, playful: ProductCardPlayful },
  productPage: { minimal: ProductPageMinimal, bold: ProductPageBold, editorial: ProductPageEditorial, playful: ProductPagePlayful },
  cartDrawer: { minimal: CartViewMinimal, bold: CartViewBold, editorial: CartViewEditorial, playful: CartViewPlayful },
  checkout: { minimal: CheckoutMinimal, bold: CheckoutBold, editorial: CheckoutEditorial, playful: CheckoutPlayful },
  reviews: { minimal: ReviewsMinimal, bold: ReviewsBold, editorial: ReviewsEditorial, playful: ReviewsPlayful },
  newsletter: { minimal: NewsletterMinimal, bold: NewsletterBold, editorial: NewsletterEditorial, playful: NewsletterPlayful },
  footer: { minimal: FooterMinimal, bold: FooterBold, editorial: FooterEditorial, playful: FooterPlayful },
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
