import { BadgeCheck } from "lucide-react";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import type { ReviewsProps } from "../types";

export function ReviewsMinimal({ reviews, ratingAvg, ratingCount, locale, labels, formSlot }: ReviewsProps) {
  return (
    <div className="grid gap-8 @tablet:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{labels.title}</h2>
        {ratingCount > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-4xl font-semibold">{ratingAvg.toFixed(1)}</span>
            <RatingStars value={ratingAvg} count={ratingCount} size={18} />
          </div>
        )}
        {formSlot}
      </div>
      {reviews.length === 0 ? (
        <p className="text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="divide-y">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 py-4">
              <div className="flex items-center gap-2">
                <RatingStars value={r.rating} />
                <span className="text-sm font-medium">{r.authorName}</span>
                {r.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <BadgeCheck className="size-3.5" /> {labels.verified}
                  </span>
                )}
                <time className="ms-auto text-xs text-muted-foreground" dateTime={r.createdAt}>
                  {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(r.createdAt))}
                </time>
              </div>
              {r.title && <p className="font-medium">{r.title}</p>}
              {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
