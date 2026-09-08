import { Link } from "@/i18n/navigation";
import { categoryNavItems } from "@/components/storefront/shared/category-nav";
import { MobileNav } from "@/components/storefront/shared/mobile-nav";
import { SearchForm } from "@/components/storefront/shared/search-form";
import { StoreLogo } from "@/components/storefront/shared/store-logo";
import { cn } from "@/lib/utils";
import type { NavbarProps } from "../types";

const navLink =
  "inline-flex shrink-0 items-center border-b-2 border-transparent px-2 py-1 text-sm font-bold tracking-wide whitespace-nowrap uppercase text-foreground/70 transition-colors hover:border-foreground hover:text-foreground focus-visible:border-foreground focus-visible:text-foreground focus-visible:outline-none aria-[current=page]:border-foreground aria-[current=page]:text-foreground";

export function NavbarBold({ storeName, logoUrl, categories, labels, cartSlot, accountSlot, localeSlot }: NavbarProps) {
  const primary = [
    { href: "/", label: labels.home },
    { href: "/shop", label: labels.shop },
    { href: "/brands", label: labels.brands },
  ];
  const categoryTree = categoryNavItems(categories);
  const categoryLinks = categoryTree.map(({ href, label }) => ({ href, label }));
  const brand = <StoreLogo storeName={storeName} logoUrl={logoUrl} className="[&_span:last-child]:font-extrabold [&_span:last-child]:uppercase" />;

  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 @tablet:h-20 @tablet:gap-6">
        <div className="flex items-center gap-1">
          <MobileNav
            labels={{ menu: labels.menu, closeMenu: labels.closeMenu, categories: labels.categories, search: labels.search }}
            brand={brand}
            primary={primary}
            categories={categoryTree}
            footer={
              <>
                {localeSlot}
                {accountSlot}
              </>
            }
          />
          {brand}
        </div>

        <nav aria-label={labels.menu} className="hidden min-w-0 items-center justify-center gap-2 overflow-hidden @tablet:flex @desktop:gap-4">
          <Link href="/shop" className={navLink}>
            {labels.shop}
          </Link>
          <Link href="/brands" className={navLink}>
            {labels.brands}
          </Link>
          {categoryLinks.map((l, i) => (
            <Link key={l.href} href={l.href} className={cn(navLink, i >= 5 ? "hidden" : i >= 3 ? "hidden @wide:inline-flex" : undefined)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-0.5 @tablet:gap-1">
          <SearchForm
            placeholder={labels.search}
            className="hidden w-44 @tablet:block @desktop:w-64 @tablet:me-1 [&_input]:rounded-none [&_input]:border-2 [&_input]:border-foreground [&_input]:bg-background"
          />
          <div className="hidden @tablet:block">{localeSlot}</div>
          {accountSlot}
          {cartSlot}
        </div>
      </div>
    </header>
  );
}
