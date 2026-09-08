import Image from "next/image";
import { cn } from "@/lib/utils";

/** Brand logo when the brand has one, otherwise an initials tile (first letters of up to two words). */
export function BrandMark({ name, logoUrl, size = 64, className }: { name: string; logoUrl: string | null; size?: number; className?: string }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("") || "•";
  if (logoUrl) {
    return (
      <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl bg-muted p-2", className)} style={{ width: size, height: size }}>
        <Image src={logoUrl} alt="" width={size} height={size} className="size-full object-contain" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-xl bg-primary font-bold text-primary-foreground", className)}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials}
    </span>
  );
}
