import { BadgeCheck } from "lucide-react";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import type { ReviewsProps } from "../types";

export function ReviewsEditorial({ reviews, ratingAvg, ratingCount, locale, labels, formSlot }: ReviewsProps) {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  return (
    <div className="grid gap-10 md:grid-cols-[280px_1fr] md:gap-14">
      <div className="flex flex-col gap-4">
        <h2 className="font-serif text-3xl font-medium tracking-tight">{labels.title}</h2>
        {ratingCount > 0 && (
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-5xl font-medium tabular-nums">{ratingAvg.toFixed(1)}</span>
            <RatingStars value={ratingAvg} count={ratingCount} size={16} className="opacity-60" />
          </div>
        )}
        {formSlot}
      </div>
      {reviews.length === 0 ? (
        <p className="font-serif text-lg italic text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="divide-y divide-foreground/15">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 py-8 first:pt-0">
              {r.title && <p className="font-serif text-2xl font-medium leading-snug text-balance md:text-3xl">{r.title}</p>}
              {r.body && <p className={r.title ? "max-w-prose text-sm leading-relaxed text-muted-foreground" : "max-w-prose font-serif text-xl leading-snug"}>{r.body}</p>}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                <RatingStars value={r.rating} className="opacity-60" />
                <span className="text-xs uppercase tracking-[0.15em]">{r.authorName}</span>
                {r.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <BadgeCheck className="size-3.5" /> {labels.verified}
                  </span>
                )}
                <time className="ms-auto text-xs text-muted-foreground" dateTime={r.createdAt}>
                  {date.format(new Date(r.createdAt))}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
