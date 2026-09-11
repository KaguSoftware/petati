"use client";

import { useEffect } from "react";

/** `?print=1`: open the print dialog once the sheet has painted (the runs page's Print button). */
export function AutoPrint() {
  useEffect(() => {
    const id = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
