import { Link } from "@/i18n/navigation";
import type { FooterProps } from "../types";

const heading = "text-xs uppercase tracking-[0.2em] text-muted-foreground";
const link = "text-sm text-foreground/80 transition-colors hover:text-primary";

export function FooterEditorial({ storeName, tagline, categories, contactEmail, contactPhone, labels, localeSlot, year }: FooterProps) {
  return (
    <footer className="border-t border-foreground/15 bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:gap-8">
        <div className="flex flex-col gap-3">
          <p className="font-serif text-3xl font-medium tracking-tight md:text-4xl">{storeName}</p>
          {tagline && <p className="max-w-xs font-serif text-sm italic text-muted-foreground">{tagline}</p>}
        </div>
        <div className="flex flex-col gap-3">
          <p className={heading}>{labels.categories}</p>
          {categories.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className={link}>
              {c.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <p className={heading}>{labels.contact}</p>
          {contactEmail && <a href={`mailto:${contactEmail}`} className={link}>{contactEmail}</a>}
          {contactPhone && <a href={`tel:${contactPhone}`} className={link} dir="ltr">{contactPhone}</a>}
        </div>
        <div className="flex flex-col gap-3">
          <p className={heading}>{labels.about}</p>
          <Link href="/privacy" className={link}>{labels.privacy}</Link>
          <Link href="/terms" className={link}>{labels.terms}</Link>
        </div>
      </div>
      <div className="border-t border-foreground/15">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          <span>
            © {year} {storeName}. {labels.rights}
          </span>
          {localeSlot}
        </div>
      </div>
    </footer>
  );
}
