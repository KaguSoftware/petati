import { Link } from "@/i18n/navigation";
import { categoryNavItems } from "@/components/storefront/shared/category-nav";
import { MobileNav } from "@/components/storefront/shared/mobile-nav";
import { SearchForm } from "@/components/storefront/shared/search-form";
import { NavScrollState } from "@/components/storefront/shared/nav-scroll-state";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StoreLogo } from "@/components/storefront/shared/store-logo";
import { cn } from "@/lib/utils";
import type { NavbarProps } from "../types";

const navLink =
  "inline-flex shrink-0 items-center px-2.5 py-1.5 text-[11px] uppercase tracking-[0.18em] whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4 focus-visible:outline-none";

/** Split header: links on the start side, a centred serif wordmark, more links and the icons on the end side. */
export function NavbarEditorial({ storeName, logoUrl, categories, labels, cartSlot, accountSlot, localeSlot }: NavbarProps) {
  const primary = [
    { href: "/", label: labels.home },
    { href: "/shop", label: labels.shop },
    { href: "/brands", label: labels.brands },
  ];
  const categoryTree = categoryNavItems(categories);
  const categoryLinks = categoryTree.map(({ href, label }) => ({ href, label }));
  const startLinks = categoryLinks.slice(0, 1);
  const endLinks = categoryLinks.slice(1, 3);
  const brand = <StoreLogo storeName={storeName} logoUrl={logoUrl} className="font-serif [&>span:last-child]:text-xl [&>span:last-child]:font-medium [&>span:last-child]:tracking-normal @tablet:[&>span:last-child]:text-2xl" />;

  return (
    <header data-navbar-overlay data-at-top="true" className="sticky top-0 z-40 border-b border-foreground/15 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/80">
      <NavScrollState />
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
          <nav aria-label={labels.menu} className="hidden items-center @tablet:flex">
            <Link href="/shop" className={navLink}>
              {labels.shop}
            </Link>
            <Link href="/brands" className={navLink}>
              {labels.brands}
            </Link>
            {startLinks.map((l) => (
              <Link key={l.href} href={l.href} className={cn(navLink, "hidden @wide:inline-flex")}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="justify-self-center">{brand}</div>
        <div className="flex items-center justify-end gap-0.5">
          <nav aria-label={labels.categories} className="hidden items-center @desktop:flex">
            {endLinks.map((l, i) => (
              <Link key={l.href} href={l.href} className={cn(navLink, i > 0 && "hidden @wide:inline-flex")}>
                {l.label}
              </Link>
            ))}
          </nav>
          {/* Icon-only search until there is room for the field itself. */}
          <Link href="/shop" aria-label={labels.search} className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "hidden @tablet:inline-flex @wide:hidden")}>
            <Search className="size-5" />
          </Link>
          <SearchForm placeholder={labels.search} className="hidden w-44 @wide:block @wide:me-1 [&_input]:rounded-none [&_input]:border-0 [&_input]:border-b [&_input]:border-foreground/30 [&_input]:bg-transparent" />
          <div className="hidden @tablet:block">{localeSlot}</div>
          {accountSlot}
          {cartSlot}
        </div>
      </div>
    </header>
  );
}
