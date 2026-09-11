"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Paper copy of the receipt. Hidden from the printout itself. */
export function PrintButton({ label }: { label: string }) {
  return (
    <Button type="button" variant="outline" size="lg" onClick={() => window.print()} className="print:hidden">
      <Printer data-icon="inline-start" />
      {label}
    </Button>
  );
}
