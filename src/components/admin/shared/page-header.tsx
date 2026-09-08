import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface Props {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons / links rendered at the end of the header row. */
  actions?: React.ReactNode;
  /** Optional back link (detail pages). */
  back?: { href: string; label: string };
  className?: string;
}

export function PageHeader({ title, description, actions, back, className }: Props) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {back && (
        <Link href={back.href} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ms-2 w-fit text-muted-foreground")}>
          <ArrowLeft className="rtl:-scale-x-100" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
