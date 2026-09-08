import { BadgeCheck } from "lucide-react";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import type { ReviewsProps } from "../types";

export function ReviewsPlayful({ reviews, ratingAvg, ratingCount, locale, labels, formSlot }: ReviewsProps) {
  return (
    <div className="grid gap-8 md:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">{labels.title}</h2>
        {ratingCount > 0 && (
          <div className="flex items-center gap-4 rounded-3xl bg-accent/20 px-5 py-4 ring-1 ring-foreground/5">
            <span className="text-5xl font-bold tabular-nums text-accent-foreground">{ratingAvg.toFixed(1)}</span>
            <RatingStars value={ratingAvg} count={ratingCount} size={18} className="flex-col items-start gap-0.5" />
          </div>
        )}
        {formSlot}
      </div>
      {reviews.length === 0 ? (
        <p className="rounded-3xl bg-muted/60 px-6 py-10 text-center text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="relative flex flex-col gap-1.5 rounded-3xl bg-muted p-5 after:absolute after:-bottom-2 after:start-8 after:size-4 after:rotate-45 after:rounded-sm after:bg-muted"
            >
              <div className="flex flex-wrap items-center gap-2">
                <RatingStars value={r.rating} />
                <span className="text-sm font-semibold">{r.authorName}</span>
                {r.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <BadgeCheck className="size-3.5" /> {labels.verified}
                  </span>
                )}
                <time className="ms-auto text-xs text-muted-foreground" dateTime={r.createdAt}>
                  {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(r.createdAt))}
                </time>
              </div>
              {r.title && <p className="font-semibold">{r.title}</p>}
              {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
