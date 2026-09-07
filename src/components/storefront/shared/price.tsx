import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({
  amount,
  compareAt,
  currency,
  locale,
  className,
}: {
  amount: number;
  compareAt?: number | null;
  currency: string;
  locale: string;
  className?: string;
}) {
  const onSale = compareAt !== null && compareAt !== undefined && compareAt > amount;
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold tabular-nums", onSale && "text-primary")}>
        {formatMoney(amount, currency, locale)}
      </span>
      {onSale && (
        <s className="text-sm text-muted-foreground tabular-nums">{formatMoney(compareAt, currency, locale)}</s>
      )}
    </span>
  );
}
