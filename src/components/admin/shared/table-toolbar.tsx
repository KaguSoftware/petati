"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface Props {
  /** Search box placeholder; omit to hide the search box. */
  searchPlaceholder?: string;
  /** Filter controls (Selects, Tabs, date pickers) rendered after the search box. */
  children?: ReactNode;
  /** Right-aligned actions (e.g. "New product"). */
  actions?: ReactNode;
  className?: string;
}

/** Writes `q` to the URL (debounced) and resets `page`. Filter children use `useListNavigation`. */
export function TableToolbar({ searchPlaceholder, children, actions, className }: Props) {
  const t = useTranslations("admin.common");
  const params = useSearchParams();
  const { setParam } = useListNavigation();
  const [value, setValue] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {searchPlaceholder && (
        <div className="relative w-full sm:w-64">
          <Search aria-hidden className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            dir="auto"
            value={value}
            placeholder={searchPlaceholder ?? t("search")}
            aria-label={searchPlaceholder ?? t("search")}
            className="ps-8 [&::-webkit-search-cancel-button]:appearance-none"
            onChange={(e) => {
              const next = e.target.value;
              setValue(next);
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => setParam("q", next.trim() || null), 300);
            }}
          />
        </div>
      )}
      {children}
      {actions && <div className="ms-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Helper for filter controls: set/remove search params and jump back to page 1. */
export function useListNavigation() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  function setParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }
  return { params, setParams, setParam: (key: string, value: string | null) => setParams({ [key]: value }) };
}
