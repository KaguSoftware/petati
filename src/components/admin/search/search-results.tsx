"use client";

import { Package, Truck, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LookupMatch } from "@/lib/admin/delivery/queries";
import type { CourierHit, CustomerHit, GlobalSearchResult, ProductHit, SearchKind } from "@/lib/admin/search/types";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../shared/status-badge";
import { OrderHit } from "./order-hit";

export type FlatHit =
  | { id: string; kind: "orders"; href: string; hit: LookupMatch }
  | { id: string; kind: "customers"; href: string; hit: CustomerHit }
  | { id: string; kind: "products"; href: string; hit: ProductHit }
  | { id: string; kind: "couriers"; href: string; hit: CourierHit };

/** One ordered list across groups, so arrow keys walk the whole palette. */
export function flatten(r: GlobalSearchResult): FlatHit[] {
  const out: FlatHit[] = [];
  for (const m of r.orders ?? []) out.push({ id: `gs-orders-${m.orderId}`, kind: "orders", href: `/admin/orders/${m.orderId}`, hit: m });
  for (const c of r.customers ?? []) out.push({ id: `gs-customers-${c.id}`, kind: "customers", href: `/admin/customers/${c.id}`, hit: c });
  for (const p of r.products ?? []) out.push({ id: `gs-products-${p.id}`, kind: "products", href: `/admin/products/${p.id}`, hit: p });
  for (const k of r.couriers ?? []) out.push({ id: `gs-couriers-${k.id}`, kind: "couriers", href: `/admin/delivery/couriers/${k.id}`, hit: k });
  return out;
}

interface Props {
  id: string;
  query: string;
  result: GlobalSearchResult | null;
  flat: FlatHit[];
  activeId?: string;
  locale: string;
  canConfirm: boolean;
  confirming: boolean;
  onHover: (index: number) => void;
  onPick: (hit: FlatHit) => void;
  onConfirm: (orderId: string, number: string) => void;
}

const ORDER: SearchKind[] = ["orders", "customers", "products", "couriers"];

export function SearchResults({ id, query, result, flat, activeId, locale, canConfirm, confirming, onHover, onPick, onConfirm }: Props) {
  const t = useTranslations("admin.search");
  if (query.trim().length < 2) return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("hint")}</p>;
  if (result && flat.length === 0) return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("none")}</p>;
  if (!result) return <div className="h-24" aria-hidden />;

  let index = -1;
  return (
    <ul id={id} role="listbox" aria-label={t("title")} className="max-h-[min(60vh,26rem)] overflow-y-auto p-1">
      {ORDER.map((kind) => {
        const hits = flat.filter((h) => h.kind === kind);
        if (hits.length === 0) return null;
        return (
          <li key={kind} role="presentation" className="contents">
            <div className="px-2 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{t(`groups.${kind}`)}</div>
            <ul role="group" className="contents">
              {hits.map((h) => {
                index++;
                const i = index;
                const active = h.id === activeId;
                return (
                  <li
                    key={h.id}
                    id={h.id}
                    role="option"
                    aria-selected={active}
                    data-active={active || undefined}
                    onMouseMove={() => onHover(i)}
                    onClick={() => onPick(h)}
                    className={cn("cursor-pointer rounded-lg px-2 py-2 text-sm transition-colors", active && "bg-accent")}
                  >
                    <Row hit={h} locale={locale} canConfirm={canConfirm} confirming={confirming} onConfirm={onConfirm} />
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

function Row({ hit, locale, canConfirm, confirming, onConfirm }: { hit: FlatHit; locale: string; canConfirm: boolean; confirming: boolean; onConfirm: Props["onConfirm"] }) {
  const t = useTranslations("admin.search");
  if (hit.kind === "orders") {
    const m = hit.hit;
    return <OrderHit match={m} locale={locale} canConfirm={canConfirm} confirming={confirming} onConfirm={() => onConfirm(m.orderId, m.orderNumber)} />;
  }
  if (hit.kind === "customers") {
    const c = hit.hit;
    return (
      <div className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
          <UserRound className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{c.name ?? c.email}</p>
          <p className="truncate text-xs text-muted-foreground" dir="ltr">
            {[c.email, c.phone].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
    );
  }
  if (hit.kind === "products") {
    const p = hit.hit;
    return (
      <div className="flex items-center gap-3">
        {p.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.thumbnail} alt="" className="size-8 shrink-0 rounded-md border bg-muted object-cover" />
        ) : (
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <Package className="size-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{p.name}</p>
          {p.sku && (
            <p className="truncate text-xs text-muted-foreground" dir="ltr">
              {p.sku}
            </p>
          )}
        </div>
        <StatusBadge kind="product" value={p.status} />
      </div>
    );
  }
  const k = hit.hit;
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
        <Truck className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{k.name}</p>
        {k.phone && (
          <p className="truncate text-xs text-muted-foreground" dir="ltr">
            {k.phone}
          </p>
        )}
      </div>
      {!k.isActive && <span className="text-xs text-muted-foreground">{t("inactive")}</span>}
    </div>
  );
}
