import { createElement, Fragment, type ReactNode } from "react";
import type { SectionKey, StoreTheme, VariantKey } from "./types";

/** `productGrid` previews are keyed by grid variant AND card variant, so every mix is honest. */
export type GridCombo = `${VariantKey}:${VariantKey}`;
export const gridCombo = (grid: VariantKey, card: VariantKey): GridCombo => `${grid}:${card}`;

/** Sections pre-rendered on the server with fixture data (see `buildSectionPreviews`). */
export type SectionPreviews = Record<Exclude<SectionKey, "productGrid" | "productCard">, Record<VariantKey, ReactNode>> & {
  productGrid: Record<GridCombo, ReactNode>;
};

/**
 * The home page in the order the storefront renders it, as a keyed list ready to render as
 * children. Callers may swap in live nodes (hero, announcement).
 */
export function composeHome(
  p: SectionPreviews,
  sections: StoreTheme["sections"],
  overrides: Partial<Record<"announcementBar" | "hero", ReactNode>> = {},
): ReactNode[] {
  const parts: [string, ReactNode][] = [
    ["announcementBar", "announcementBar" in overrides ? overrides.announcementBar : p.announcementBar[sections.announcementBar]],
    ["navbar", p.navbar[sections.navbar]],
    ["hero", "hero" in overrides ? overrides.hero : p.hero[sections.hero]],
    ["categoryBanner", p.categoryBanner[sections.categoryBanner]],
    ["productGrid", p.productGrid[gridCombo(sections.productGrid, sections.productCard)]],
    ["newsletter", p.newsletter[sections.newsletter]],
    ["footer", p.footer[sections.footer]],
  ];
  return parts.map(([key, node]) => createElement(Fragment, { key }, node));
}
