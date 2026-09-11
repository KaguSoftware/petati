"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settleCashAction } from "@/lib/admin/delivery/actions";
import { toMajor } from "@/lib/money";
import { useOptimisticAction } from "../shared/use-optimistic-action";

interface CashRow {
  id: string;
  orderNumber: string;
  customer: string | null;
  expected: number;
  collected: number;
  expectedLabel: string;
  collectedLabel: string;
}

interface Props {
  storeId: string;
  courier: { id: string; name: string };
  rows: CashRow[];
  expectedLabel: string;
  collectedTotal: number;
  collectedLabel: string;
  currency: string;
}

/**
 * One courier's outstanding cash. Stops are ticked explicitly and the action re-checks the exact ids,
 * so a stop that closes while this sheet is open can never be swept into somebody's count.
 *
 * A short stop (collected < expected) is settled too, but it records no payment — the order stays
 * unpaid and visibly short, which is the honest representation of money that did not arrive.
 */
export function CashSheet({ storeId, courier, rows, expectedLabel, collectedTotal, collectedLabel, currency }: Props) {
  const t = useTranslations("admin.delivery.cash");
  const { run, pending } = useOptimisticAction("admin.delivery");
  const [picked, setPicked] = useState<Set<string>>(new Set(rows.map((r) => r.id)));
  const [received, setReceived] = useState(String(toMajor(collectedTotal, currency)));

  const chosen = rows.filter((r) => picked.has(r.id));

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function settle() {
    if (chosen.length === 0) return;
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("courierId", courier.id);
    fd.set("received", received);
    for (const r of chosen) fd.append("deliveryIds", r.id);
    run(() => settleCashAction({}, fd), { onSuccess: () => toast.success(t("settled")) });
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-medium">{courier.name}</h2>
        <p className="text-sm text-muted-foreground">
          {t("expected")}: <span className="tabular-nums">{expectedLabel}</span> · {t("collected")}:{" "}
          <span className="font-medium text-foreground tabular-nums">{collectedLabel}</span>
        </p>
      </header>

      <ul className="divide-y text-sm">
        {rows.map((r) => {
          const short = r.collected < r.expected;
          return (
            <li key={r.id} className="flex items-center gap-3 py-2">
              <Checkbox checked={picked.has(r.id)} onCheckedChange={() => toggle(r.id)} aria-label={r.orderNumber} />
              <span dir="ltr" className="tabular-nums">
                {r.orderNumber}
              </span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{r.customer ?? "—"}</span>
              {short && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-800 dark:text-amber-300">{t("short")}</span>}
              <span className="tabular-nums">{r.collectedLabel}</span>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t pt-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`received-${courier.id}`}>{t("received")}</Label>
          <Input
            id={`received-${courier.id}`}
            value={received}
            onChange={(e) => setReceived(e.target.value)}
            inputMode="decimal"
            dir="ltr"
            className="w-36 tabular-nums"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground tabular-nums">{chosen.length}/{rows.length}</span>
          <Button type="button" disabled={pending || chosen.length === 0} onClick={settle}>
            {t("settle")}
          </Button>
        </div>
      </div>
    </section>
  );
}
