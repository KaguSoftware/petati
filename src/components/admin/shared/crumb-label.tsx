"use client";

import { useLayoutEffect } from "react";
import { clearCrumbLabel, setCrumbLabel } from "./crumb-labels";

/** Rendered by a detail page: names its id segment in the breadcrumb strip while the page is mounted. */
export function CrumbLabel({ segment, label }: { segment: string; label: string }) {
  useLayoutEffect(() => {
    setCrumbLabel(segment, label);
    return () => clearCrumbLabel(segment);
  }, [segment, label]);
  return null;
}
