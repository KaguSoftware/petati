"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

/**
 * A courier standing at a door with a parcel should not scroll. Typing the six digits the customer
 * reads out — or the order number — narrows the list to that stop immediately; the filtering is
 * client-side over stops they already have, so it costs no round trip and works on bad signal.
 */
export function StopFinder({ onQuery }: { onQuery: (q: string) => void }) {
  const t = useTranslations("courier");
  const [value, setValue] = useState("");
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onQuery(e.target.value.trim());
        }}
        inputMode="search"
        autoComplete="off"
        placeholder={t("find")}
        aria-label={t("find")}
        className="h-11 ps-9"
      />
    </div>
  );
}
