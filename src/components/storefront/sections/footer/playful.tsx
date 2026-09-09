import { Link } from "@/i18n/navigation";
import { ContactBlock } from "@/components/storefront/shared/contact-block";
import { PaymentBadges } from "@/components/storefront/shared/payment-badges";
import { SocialLinks } from "@/components/storefront/shared/social-links";
import { StoreLogo } from "@/components/storefront/shared/store-logo";
import { TrustStrip } from "@/components/storefront/shared/trust-strip";
import type { FooterLink, FooterProps } from "../types";

const chip = "rounded-full bg-background/60 px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm";

function Chips({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-3">
      <p className="font-bold">{title}</p>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={chip}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** Rounded panel: trust cards on top, chip links, and a contact card with round social buttons. */
export function FooterPlayful({ storeName, logoUrl, tagline, shopLinks, infoLinks, contact, social, trustItems, payments, labels, localeSlot, year }: FooterProps) {
  return (
    <footer className="mt-8 rounded-t-[3rem] bg-muted ring-1 ring-foreground/5">
      <TrustStrip items={trustItems} tone="cards" className="pt-6" />
      <div className="mx-auto grid max-w-7xl gap-10 px-gutter pt-8 pb-10 @tablet:grid-cols-2 @desktop:grid-cols-[1.3fr_1fr_1.1fr] @desktop:gap-8">
        <div className="flex flex-col gap-5">
          <StoreLogo storeName={storeName} logoUrl={logoUrl} className="self-start" markClassName="rounded-full" wordmarkClassName="text-xl font-bold" />
          {tagline && <p className="bidi-auto max-w-sm text-sm text-muted-foreground">{tagline}</p>}
          <Chips title={labels.shop} links={shopLinks} />
        </div>
        <Chips title={labels.info} links={infoLinks} />
        <div className="flex flex-col gap-4 rounded-3xl bg-background p-5 shadow-sm ring-1 ring-foreground/5 @tablet:col-span-2 @desktop:col-span-1">
          <p className="font-bold">{labels.contact}</p>
          <ContactBlock contact={contact} labels={labels} />
          {social.length > 0 && (
            <div className="flex flex-col gap-2 border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground">{labels.followUs}</p>
              <SocialLinks links={social} variant="round" />
            </div>
          )}
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-gutter pb-8 text-xs text-muted-foreground @tablet:flex-row @tablet:items-center @tablet:justify-between">
        <span className="w-fit rounded-full bg-background/60 px-3 py-1">
          <bdi dir="ltr">© {year} {storeName}.</bdi> {labels.rights}
        </span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <PaymentBadges methods={payments} caption={labels.weAccept} />
          {localeSlot}
        </div>
      </div>
    </footer>
  );
}
