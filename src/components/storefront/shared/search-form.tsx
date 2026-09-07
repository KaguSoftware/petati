"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

export function SearchForm({ placeholder, className }: { placeholder: string; className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <form
      role="search"
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
        router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
      }}
    >
      <label className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring">
        <Search className="size-4 text-muted-foreground" />
        <input name="q" defaultValue={params.get("q") ?? ""} placeholder={placeholder} className="w-full bg-transparent outline-none" />
      </label>
    </form>
  );
}
