"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { StatusTabs, type StatusTabItem } from "./status-tabs";

export interface TabPanel extends StatusTabItem {
  /** Pre-rendered (usually server) content for this tab. */
  content: ReactNode;
}

interface Props {
  panels: TabPanel[];
  /** Accessible name of the tab strip. */
  label: string;
  /** URL search param mirrored for refresh/deep-links (`?tab=…`). */
  param?: string;
  /** Tab that omits the param. Defaults to the first panel. */
  defaultValue?: string;
  /** Rendered between the strip and the panels (toolbar, banners). */
  children?: ReactNode;
  /** Initial tab when the URL carries none (server-resolved so the first paint is right). */
  initial?: string;
}

/**
 * Client-side tab switcher: every panel is rendered up front on the server and passed in, so
 * switching is local state — instant, no navigation, no refetch. The URL mirrors the active tab
 * through `history.replaceState` (Next syncs `useSearchParams`), so refresh and deep-links work,
 * but changing tabs never hits the router.
 */
export function TabbedPanels({ panels, label, param = "tab", defaultValue, children, initial }: Props) {
  const pathname = usePathname();
  const params = useSearchParams();
  const fallback = defaultValue ?? panels[0]?.value;
  const fromUrl = params.get(param);
  const start = panels.some((p) => p.value === fromUrl) ? (fromUrl as string) : (initial ?? fallback);
  const [active, setActive] = useState(start);

  function select(value: string) {
    setActive(value);
    const next = new URLSearchParams(params.toString());
    if (value === fallback) next.delete(param);
    else next.set(param, value);
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-col gap-4">
      <StatusTabs label={label} value={active} items={panels} onValueChange={select} />
      {children}
      {panels.map((p) => (
        <div key={p.value} role="tabpanel" hidden={p.value !== active} className="flex flex-col gap-4">
          {p.content}
        </div>
      ))}
    </div>
  );
}
