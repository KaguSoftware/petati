import { Link } from "@/i18n/navigation";
import { categoryNavItems } from "@/components/storefront/shared/category-nav";
import { MobileNav } from "@/components/storefront/shared/mobile-nav";
import { SearchForm } from "@/components/storefront/shared/search-form";
import { StoreLogo } from "@/components/storefront/shared/store-logo";
import { cn } from "@/lib/utils";
import type { NavbarProps } from "../types";

const navLink =
  "inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-sm focus-visible:bg-background focus-visible:text-foreground focus-visible:shadow-sm focus-visible:outline-none";

export function NavbarPlayful({ storeName, logoUrl, categories, labels, cartSlot, accountSlot, localeSlot }: NavbarProps) {
  const primary = [
    { href: "/", label: labels.home },
    { href: "/shop", label: labels.shop },
    { href: "/brands", label: labels.brands },
  ];
  const categoryTree = categoryNavItems(categories);
  const categoryLinks = categoryTree.map(({ href, label }) => ({ href, label }));
  const brand = <StoreLogo storeName={storeName} logoUrl={logoUrl} />;

  return (
    <header className="sticky top-0 z-40 bg-background/80 shadow-sm shadow-primary/5 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 @tablet:gap-6">
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

        <nav aria-label={labels.menu} className="hidden min-w-0 items-center justify-center @tablet:flex">
          <div className="flex min-w-0 items-center gap-1 overflow-hidden rounded-full bg-muted/70 p-1 ring-1 ring-foreground/5">
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
          </div>
        </nav>

        <div className="flex items-center justify-end gap-0.5 @tablet:gap-1">
          <SearchForm placeholder={labels.search} className="hidden w-44 @tablet:block @desktop:w-64 @tablet:me-1" />
          <div className="hidden @tablet:block">{localeSlot}</div>
          {accountSlot}
          {cartSlot}
        </div>
      </div>
    </header>
  );
}
