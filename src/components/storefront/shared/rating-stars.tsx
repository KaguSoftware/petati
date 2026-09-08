import { Star } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  count,
  className,
  size = 14,
}: {
  value: number;
  count?: number;
  className?: string;
  size?: number;
}) {
  const locale = useLocale();
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-label={`${value} / 5`}>
      <span className="inline-flex" dir="ltr">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={i <= Math.round(value) ? "fill-accent text-accent" : "text-muted-foreground/40"}
          />
        ))}
      </span>
      {count !== undefined && <span className="text-xs text-muted-foreground">({new Intl.NumberFormat(locale).format(count)})</span>}
    </span>
  );
}
