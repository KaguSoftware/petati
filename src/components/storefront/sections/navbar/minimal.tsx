import { Link } from "@/i18n/navigation";
import { categoryNavItems } from "@/components/storefront/shared/category-nav";
import { MobileNav } from "@/components/storefront/shared/mobile-nav";
import { SearchForm } from "@/components/storefront/shared/search-form";
import { NavScrollState } from "@/components/storefront/shared/nav-scroll-state";
import { StoreLogo } from "@/components/storefront/shared/store-logo";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { NavbarProps } from "../types";

const navLink =
  "inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-ring";

/** Classic bar. Category budget: Shop + Brands until @wide, then categories #1–#3 (the drawer lists them all); the search field never truncates its placeholder. */
export function NavbarMinimal({ storeName, logoUrl, categories, labels, cartSlot, accountSlot, localeSlot }: NavbarProps) {
  const primary = [
    { href: "/", label: labels.home },
    { href: "/shop", label: labels.shop },
    { href: "/brands", label: labels.brands },
  ];
  const categoryTree = categoryNavItems(categories);
  const categoryLinks = categoryTree.map(({ href, label }) => ({ href, label }));
  const brand = <StoreLogo storeName={storeName} logoUrl={logoUrl} />;

  return (
    <header data-navbar-overlay data-at-top="true" className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <NavScrollState />
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-gutter">
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

        {/* Centred on the page (not between logo and icons) from desktop up. */}
        <nav
          aria-label={labels.menu}
          className="hidden items-center gap-1 @tablet:flex @desktop:absolute @desktop:start-1/2 @desktop:-translate-x-1/2 @desktop:gap-2 rtl:@desktop:translate-x-1/2"
        >
          <Link href="/shop" className={navLink}>
            {labels.shop}
          </Link>
          <Link href="/brands" className={navLink}>
            {labels.brands}
          </Link>
          {categoryLinks.map((l, i) => (
            <Link key={l.href} href={l.href} className={cn(navLink, i >= 3 ? "hidden" : "hidden @wide:inline-flex")}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-0.5 @tablet:gap-1">
          <Link href="/shop" aria-label={labels.search} className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "hidden @tablet:inline-flex @desktop:hidden")}>
            <Search className="size-5" />
          </Link>
          <SearchForm placeholder={labels.search} className="hidden w-48 shrink-0 @desktop:block @desktop:me-1 @wide:w-52" />
          <div className="hidden @desktop:block">{localeSlot}</div>
          {accountSlot}
          {cartSlot}
        </div>
      </div>
    </header>
  );
}
