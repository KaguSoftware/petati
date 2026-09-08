import { Link } from "@/i18n/navigation";
import type { FooterProps } from "../types";

export function FooterMinimal({ storeName, tagline, categories, contactEmail, contactPhone, labels, localeSlot, year }: FooterProps) {
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 @tablet:grid-cols-4">
        <div className="flex flex-col gap-2 @tablet:col-span-2">
          <p className="text-lg font-semibold">{storeName}</p>
          {tagline && <p className="max-w-sm text-sm text-muted-foreground">{tagline}</p>}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium">{labels.categories}</p>
          {categories.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className="text-muted-foreground hover:text-foreground">
              {c.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium">{labels.contact}</p>
          {contactEmail && <a href={`mailto:${contactEmail}`} className="text-muted-foreground hover:text-foreground">{contactEmail}</a>}
          {contactPhone && <a href={`tel:${contactPhone}`} className="text-muted-foreground hover:text-foreground" dir="ltr">{contactPhone}</a>}
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground">{labels.privacy}</Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground">{labels.terms}</Link>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-xs text-muted-foreground">
          <span>
            © {year} {storeName}. {labels.rights}
          </span>
          {localeSlot}
        </div>
      </div>
    </footer>
  );
}
