import { Link } from "@/i18n/navigation";
import { categoryNavItems } from "@/components/storefront/shared/category-nav";
import { MobileNav } from "@/components/storefront/shared/mobile-nav";
import { SearchForm } from "@/components/storefront/shared/search-form";
import { StoreLogo } from "@/components/storefront/shared/store-logo";
import { cn } from "@/lib/utils";
import type { NavbarProps } from "../types";

const navLink =
  "inline-flex shrink-0 items-center border-b-2 border-transparent px-1 py-2 text-xs font-bold tracking-widest whitespace-nowrap uppercase text-background/80 transition-colors hover:border-background hover:text-background focus-visible:border-background focus-visible:text-background focus-visible:outline-none";

/** Department-store header: search / big centred logo / icons on the first row, a dark full-width category bar below. */
export function NavbarBold({ storeName, logoUrl, categories, labels, cartSlot, accountSlot, localeSlot }: NavbarProps) {
  const primary = [
    { href: "/", label: labels.home },
    { href: "/shop", label: labels.shop },
    { href: "/brands", label: labels.brands },
  ];
  const categoryTree = categoryNavItems(categories);
  const categoryLinks = categoryTree.map(({ href, label }) => ({ href, label }));
  const brand = <StoreLogo storeName={storeName} logoUrl={logoUrl} className="[&_span:last-child]:text-xl [&_span:last-child]:font-extrabold [&_span:last-child]:uppercase @tablet:[&_span:last-child]:text-2xl" />;

  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-gutter @tablet:h-20">
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
          <SearchForm placeholder={labels.search} className="hidden w-48 @tablet:block @desktop:w-64 [&_input]:rounded-none [&_input]:border-2 [&_input]:border-foreground [&_input]:bg-background" />
        </div>
        <div className="justify-self-center">{brand}</div>
        <div className="flex items-center justify-end gap-0.5 @tablet:gap-1">
          <div className="hidden @desktop:block">{localeSlot}</div>
          {accountSlot}
          {cartSlot}
        </div>
      </div>
      <nav aria-label={labels.menu} className="hidden bg-foreground text-background @tablet:block">
        <div className="mx-auto flex h-11 max-w-7xl items-center justify-center gap-5 overflow-hidden px-gutter @desktop:gap-8">
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
    </header>
  );
}
