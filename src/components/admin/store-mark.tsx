"use client";

import { Store } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Sidebar/header mark: the store's logo when it has one, otherwise the generic store icon. */
export function StoreMark({ logoUrl, className }: { logoUrl: string | null; className?: string }) {
  return logoUrl ? (
    <Image src={logoUrl} alt="" width={24} height={24} className={cn("size-6 shrink-0 object-contain", className)} />
  ) : (
    <Store className={cn("size-5 shrink-0", className)} />
  );
}
