import type { CategoryData } from "@/lib/catalog/types";

export interface NavItem {
  href: string;
  label: string;
  /** nested links (sub-categories) rendered indented under the parent in the mobile drawer */
  children?: NavItem[];
}

/**
 * Turn the flat, ordered category list into drawer links: top-level categories with their direct
 * children nested (the tree is one level deep in practice; deeper levels are flattened under the
 * nearest top-level ancestor's child).
 */
export function categoryNavItems(categories: Pick<CategoryData, "id" | "slug" | "name" | "parentId">[]): NavItem[] {
  const byParent = new Map<string, NavItem[]>();
  for (const c of categories) {
    if (!c.parentId) continue;
    const list = byParent.get(c.parentId) ?? [];
    list.push({ href: `/c/${c.slug}`, label: c.name });
    byParent.set(c.parentId, list);
  }
  return categories
    .filter((c) => !c.parentId)
    .map((c) => {
      const children = byParent.get(c.id);
      return children?.length ? { href: `/c/${c.slug}`, label: c.name, children } : { href: `/c/${c.slug}`, label: c.name };
    });
}
