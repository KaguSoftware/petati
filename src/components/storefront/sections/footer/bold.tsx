import { Link } from "@/i18n/navigation";
import type { FooterProps } from "../types";

const heading = "text-xs font-extrabold tracking-widest uppercase";
const link = "text-sm font-medium text-background/70 decoration-2 underline-offset-4 transition-colors hover:text-background hover:underline";

export function FooterBold({ storeName, tagline, categories, contactEmail, contactPhone, labels, localeSlot, year }: FooterProps) {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 @tablet:grid-cols-4 @tablet:py-20">
        <div className="flex flex-col gap-4 @tablet:col-span-2">
          <p className="text-4xl leading-none font-extrabold tracking-tight uppercase @tablet:text-6xl">{storeName}</p>
          {tagline && <p className="max-w-sm text-sm font-medium text-background/70">{tagline}</p>}
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
          <Link href="/privacy" className={link}>{labels.privacy}</Link>
          <Link href="/terms" className={link}>{labels.terms}</Link>
        </div>
      </div>
      <div className="border-t-2 border-background/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 text-[11px] font-bold tracking-widest text-background/70 uppercase">
          <span>
            © {year} {storeName}. {labels.rights}
          </span>
          {localeSlot}
        </div>
      </div>
    </footer>
  );
}
