import { Link } from "@/i18n/navigation";
import { categoryNavItems } from "@/components/storefront/shared/category-nav";
import { MobileNav } from "@/components/storefront/shared/mobile-nav";
import { SearchForm } from "@/components/storefront/shared/search-form";
import { StoreLogo } from "@/components/storefront/shared/store-logo";
import { cn } from "@/lib/utils";
import type { NavbarProps } from "../types";

const navLink =
  "inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-sm focus-visible:bg-background focus-visible:text-foreground focus-visible:shadow-sm focus-visible:outline-none";

/** A floating capsule: the whole header lives in a rounded pill that hovers over the page, with a pill nav inside. */
export function NavbarPlayful({ storeName, logoUrl, categories, labels, cartSlot, accountSlot, localeSlot }: NavbarProps) {
  const primary = [
    { href: "/", label: labels.home },
    { href: "/shop", label: labels.shop },
    { href: "/brands", label: labels.brands },
  ];
  const categoryTree = categoryNavItems(categories);
  const categoryLinks = categoryTree.map(({ href, label }) => ({ href, label }));
  const brand = <StoreLogo storeName={storeName} logoUrl={logoUrl} className="[&>span:first-child]:rounded-full [&_img]:rounded-full" />;

  return (
    <header className="sticky top-0 z-40 pt-3 px-gutter">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center gap-2 rounded-full bg-background/85 ps-2 pe-2 shadow-lg shadow-primary/10 ring-1 ring-foreground/10 backdrop-blur supports-backdrop-filter:bg-background/75 @tablet:h-16 @tablet:ps-3 @tablet:pe-3">
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
        <nav
          aria-label={labels.menu}
          className="hidden min-w-0 flex-1 items-center justify-center @tablet:flex @desktop:absolute @desktop:start-1/2 @desktop:flex-none @desktop:-translate-x-1/2 rtl:@desktop:translate-x-1/2"
        >
          <div className="flex min-w-0 items-center gap-1 overflow-hidden rounded-full bg-muted/70 p-1 ring-1 ring-foreground/5">
            <Link href="/shop" className={navLink}>
              {labels.shop}
            </Link>
            <Link href="/brands" className={navLink}>
              {labels.brands}
            </Link>
            {categoryLinks.map((l, i) => (
              <Link key={l.href} href={l.href} className={cn(navLink, i >= 2 ? "hidden" : i >= 1 ? "hidden @wide:inline-flex" : "hidden @desktop:inline-flex")}>
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="ms-auto flex items-center gap-0.5 @tablet:gap-1">
          <SearchForm placeholder={labels.search} className="hidden w-48 @tablet:block @wide:w-52 @tablet:me-1" />
          <div className="hidden @wide:block">{localeSlot}</div>
          {accountSlot}
          {cartSlot}
        </div>
      </div>
    </header>
  );
}
