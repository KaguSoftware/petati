import { BadgeCheck } from "lucide-react";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import type { ReviewsProps } from "../types";

export function ReviewsBold({ reviews, ratingAvg, ratingCount, locale, labels, formSlot }: ReviewsProps) {
  const ratingPct = Math.min(100, Math.max(0, (ratingAvg / 5) * 100));
  return (
    <div className="grid gap-10 @tablet:grid-cols-[300px_1fr]">
      <div className="flex flex-col gap-5">
        <h2 className="text-3xl font-extrabold tracking-tight uppercase @tablet:text-4xl">{labels.title}</h2>
        {ratingCount > 0 && (
          <div className="flex flex-col gap-3 border-4 border-foreground p-5">
            <span className="text-7xl leading-none font-extrabold tracking-tighter tabular-nums">{ratingAvg.toFixed(1)}</span>
            <RatingStars value={ratingAvg} count={ratingCount} size={20} />
            <div className="h-3 w-full bg-muted" aria-hidden>
              <div className="h-full bg-foreground" style={{ width: `${ratingPct}%` }} />
            </div>
          </div>
        )}
        {formSlot}
      </div>
      {reviews.length === 0 ? (
        <p className="border-4 border-foreground py-12 text-center text-lg font-bold tracking-wide uppercase">{labels.empty}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 border-2 border-foreground p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <RatingStars value={r.rating} size={16} />
                <span className="text-sm font-extrabold tracking-wide uppercase">{r.authorName}</span>
                {r.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 bg-foreground px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-background uppercase">
                    <BadgeCheck className="size-3" /> {labels.verified}
                  </span>
                )}
                <time className="ms-auto text-xs font-medium text-muted-foreground" dateTime={r.createdAt}>
                  {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(r.createdAt))}
                </time>
              </div>
              {r.title && <p className="text-lg leading-tight font-extrabold tracking-tight">{r.title}</p>}
              {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
