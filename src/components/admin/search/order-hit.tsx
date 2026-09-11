"use client";

import { CheckCircle2, Route, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { LookupMatch } from "@/lib/admin/delivery/queries";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { EntityLink } from "../shared/entity-link";
import { StatusBadge } from "../shared/status-badge";

interface Props {
  match: LookupMatch;
  locale: string;
  canConfirm: boolean;
  confirming?: boolean;
  onConfirm?: () => void;
  className?: string;
}

/**
 * One order as a search result: number, statuses, the people and places around it as links, and —
 * the payoff — a Confirm button when the query WAS the code. Shared by the board's search box and the
 * global search in the header, so both surfaces behave the same.
 */
export function OrderHit({ match: m, locale, canConfirm, confirming, onConfirm, className }: Props) {
  const t = useTranslations("admin.delivery.search");
  return (
    <article className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="min-w-40 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <EntityLink kind="order" id={m.orderId} label={m.orderNumber} />
          <StatusBadge kind="order" value={m.orderStatus} />
          {m.deliveryState && <StatusBadge kind="delivery" value={m.deliveryState} />}
          {m.matchedByCode && (
            <Badge className="gap-1 bg-primary/10 text-primary">
              <ShieldCheck className="size-3" />
              {t("codeMatched")}
            </Badge>
          )}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          {m.customerId && m.customerName ? <EntityLink kind="customer" id={m.customerId} label={m.customerName} muted /> : m.customerName ? <span>{m.customerName}</span> : null}
          {m.address && <span className="truncate">{m.address}</span>}
          {m.courierId && m.courierName ? <EntityLink kind="courier" id={m.courierId} label={m.courierName} muted /> : null}
          {m.courierId && m.scheduledFor && (
            <Link href={`/admin/delivery/runs/${m.courierId}?d=${m.scheduledFor}`} className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
              <Route className="size-3.5" />
              {t("runSheet")}
            </Link>
          )}
          {!m.customerName && !m.address && !m.courierName && <span>—</span>}
        </p>
      </div>

      {m.cashExpected > 0 && <span className="text-sm font-medium tabular-nums">{formatMoney(m.cashCollected ?? m.cashExpected, m.currency, locale)}</span>}

      {m.phone && (
        <a href={`tel:${m.phone}`} className="text-sm text-muted-foreground hover:underline" dir="ltr">
          {m.phone}
        </a>
      )}

      {/* The payoff: the code was typed and matched, so there is nothing left to prove. */}
      {canConfirm && m.matchedByCode && m.canConfirm && onConfirm && (
        <Button
          type="button"
          size="sm"
          disabled={confirming}
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
        >
          <CheckCircle2 data-icon="inline-start" />
          {t("confirm")}
        </Button>
      )}
      {m.matchedByCode && m.triesLeft === 0 && <span className="text-xs font-medium text-destructive">{t("locked")}</span>}
    </article>
  );
}
