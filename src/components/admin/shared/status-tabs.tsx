"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { useLocale } from "next-intl";
import { OverlayScroll } from "@/components/ui/overlay-scroll";
import { cn } from "@/lib/utils";

export interface StatusTabItem {
  value: string;
  label: string;
  count?: number;
}

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  items: StatusTabItem[];
  /** Accessible name of the group. */
  label: string;
  className?: string;
}

/**
 * Segmented status filter: roomy triggers, a clear raised active state and the count in its own
 * pill so each option reads at a glance. Scrolls horizontally on narrow screens.
 */
export function StatusTabs({ value, onValueChange, items, label, className }: Props) {
  const fmt = new Intl.NumberFormat(useLocale());
  return (
    <OverlayScroll axis="x" className={cn("-mx-1 px-1", className)}>
      <TabsPrimitive.Root value={value} onValueChange={(v) => onValueChange(String(v))}>
        <TabsPrimitive.List aria-label={label} className="inline-flex w-max items-center gap-1 rounded-xl bg-muted/70 p-1">
          {items.map((item) => (
            <TabsPrimitive.Tab
              key={item.value}
              value={item.value}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm whitespace-nowrap text-muted-foreground transition-colors outline-none select-none",
                "hover:bg-background/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                "data-active:bg-background data-active:font-medium data-active:text-foreground data-active:shadow-sm",
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span
                  className={cn(
                    "inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] leading-4 font-medium tabular-nums",
                    item.value === value ? "bg-primary/10 text-primary" : "bg-foreground/[0.06] text-muted-foreground",
                  )}
                >
                  {fmt.format(item.count)}
                </span>
              )}
            </TabsPrimitive.Tab>
          ))}
        </TabsPrimitive.List>
      </TabsPrimitive.Root>
    </OverlayScroll>
  );
}
