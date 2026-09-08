import { Link } from "@/i18n/navigation";
import type { FooterProps } from "../types";

const pill = "-ms-3 w-fit rounded-full px-3 py-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm";

export function FooterPlayful({ storeName, tagline, categories, contactEmail, contactPhone, labels, localeSlot, year }: FooterProps) {
  return (
    <footer className="mt-8 rounded-t-[3rem] bg-muted ring-1 ring-foreground/5">
      <div className="mx-auto grid max-w-7xl gap-8 px-gutter pt-14 pb-10 @tablet:grid-cols-[1.4fr_1fr_1fr] @tablet:gap-10">
        <div className="flex flex-col gap-2">
          <p className="text-2xl font-bold tracking-tight">{storeName}</p>
          {tagline && <p className="max-w-sm text-sm text-muted-foreground">{tagline}</p>}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <p className="mb-1 font-bold">{labels.categories}</p>
          {categories.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className={pill}>
              {c.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <p className="mb-1 font-bold">{labels.contact}</p>
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className={pill}>
              {contactEmail}
            </a>
          )}
          {contactPhone && (
            <a href={`tel:${contactPhone}`} className={pill}>
              <bdi dir="ltr">{contactPhone}</bdi>
            </a>
          )}
          <Link href="/privacy" className={pill}>
            {labels.privacy}
          </Link>
          <Link href="/terms" className={pill}>
            {labels.terms}
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-gutter pb-8 text-xs text-muted-foreground @phablet:flex-row @phablet:items-center @phablet:justify-between">
        <span className="rounded-full bg-background/60 px-3 py-1">
          © {year} {storeName}. {labels.rights}
        </span>
        {localeSlot}
      </div>
    </footer>
  );
}
