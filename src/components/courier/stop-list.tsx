"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { CourierStop } from "@/lib/courier/context";
import { StopCard } from "./stop-card";
import { StopFinder } from "./stop-finder";

interface Props {
  token: string;
  open: CourierStop[];
  done: CourierStop[];
  locale: string;
  codEnabled: boolean;
}

/**
 * The stop list with its finder.
 *
 * Note what is NOT searchable here: the delivery code. It never reaches the courier's device on
 * purpose — the customer holds it — and a server-side code lookup that did not count against the
 * attempt budget would be a brute-force hole straight past the amber "closed without a code" flag.
 * So the courier finds a parcel the way they actually identify it: its number, the name on it, or
 * the street. The code stays what it is — proof at the door, typed into the confirm sheet.
 */
export function StopList({ token, open, done, locale, codEnabled }: Props) {
  const t = useTranslations("courier");
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();

  const match = (s: CourierStop) =>
    !q ||
    s.order_number.toLowerCase().includes(q) ||
    (s.customer_name ?? "").toLowerCase().includes(q) ||
    [s.address?.line1, s.address?.line2, s.address?.city, s.address?.postal_code].filter(Boolean).join(" ").toLowerCase().includes(q);

  const openMatches = open.filter(match);
  const doneMatches = done.filter(match);

  return (
    <div className="flex flex-col gap-4">
      {open.length + done.length > 3 && <StopFinder onQuery={setQuery} />}

      {openMatches.length === 0 && doneMatches.length === 0 && (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">{q ? t("noMatch") : t("noStops")}</p>
      )}

      {openMatches.map((stop) => (
        <StopCard key={stop.id} token={token} stop={stop} locale={locale} codEnabled={codEnabled} />
      ))}

      {doneMatches.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-sm font-medium text-muted-foreground">{t("closed")}</h2>
          {doneMatches.map((stop) => (
            <StopCard key={stop.id} token={token} stop={stop} locale={locale} codEnabled={codEnabled} />
          ))}
        </section>
      )}
    </div>
  );
}
