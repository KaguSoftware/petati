import { createElement, type ComponentType, type ReactElement } from "react";
import type { AnnouncementBarProps, HeroProps } from "@/components/storefront/sections/types";
import { AnnouncementBarBold } from "@/components/storefront/sections/announcement-bar/bold";
import { AnnouncementBarEditorial } from "@/components/storefront/sections/announcement-bar/editorial";
import { AnnouncementBarMinimal } from "@/components/storefront/sections/announcement-bar/minimal";
import { AnnouncementBarPlayful } from "@/components/storefront/sections/announcement-bar/playful";
import { HeroBold } from "@/components/storefront/sections/hero/bold";
import { HeroEditorial } from "@/components/storefront/sections/hero/editorial";
import { HeroMinimal } from "@/components/storefront/sections/hero/minimal";
import { HeroPlayful } from "@/components/storefront/sections/hero/playful";
import type { VariantKey } from "./types";

/**
 * The sections whose four variants are dependency-free enough to render on the CLIENT (no
 * translations, no async data): the admin design editor renders these itself so hero text and
 * announcement edits show up live while typing. Everything else comes pre-rendered from the
 * server via `buildSectionPreviews`. Keep these files free of server-only imports.
 */
export const HERO: Record<VariantKey, ComponentType<HeroProps>> = {
  minimal: HeroMinimal,
  bold: HeroBold,
  editorial: HeroEditorial,
  playful: HeroPlayful,
};

export const ANNOUNCEMENT_BAR: Record<VariantKey, ComponentType<AnnouncementBarProps>> = {
  minimal: AnnouncementBarMinimal,
  bold: AnnouncementBarBold,
  editorial: AnnouncementBarEditorial,
  playful: AnnouncementBarPlayful,
};

export function renderHero(variant: VariantKey, props: HeroProps): ReactElement {
  return createElement(HERO[variant] ?? HERO.minimal, props);
}

export function renderAnnouncementBar(variant: VariantKey, props: AnnouncementBarProps): ReactElement {
  return createElement(ANNOUNCEMENT_BAR[variant] ?? ANNOUNCEMENT_BAR.minimal, props);
}
