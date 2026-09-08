"use client";

import { OverlayScrollbarsComponent, type OverlayScrollbarsComponentProps } from "overlayscrollbars-react";
import { cn } from "@/lib/utils";

type Props = Omit<OverlayScrollbarsComponentProps<"div">, "options" | "element"> & {
  /** Which axis may scroll. Defaults to vertical. */
  axis?: "x" | "y" | "both";
};

/** Scroll container with themed overlay scrollbars (use instead of `overflow-auto`). */
export function OverlayScroll({ axis = "y", className, ...rest }: Props) {
  return (
    <OverlayScrollbarsComponent
      defer
      element="div"
      className={cn("min-h-0", className)}
      options={{
        scrollbars: { theme: "os-theme-petati", autoHide: "leave", autoHideDelay: 600 },
        overflow: { x: axis === "y" ? "hidden" : "scroll", y: axis === "x" ? "hidden" : "scroll" },
      }}
      {...rest}
    />
  );
}
