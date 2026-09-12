import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { dateTimeFormat } from "@/lib/number";

function shift(day: string, by: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + by));
  return date.toISOString().slice(0, 10);
}

/** Previous / today / next day links for the run pages (`?d=`), plus the long date. Plain links: no client code. */
export async function DayNav({ day, today, basePath, locale, className }: { day: string; today: string; basePath: string; locale: string; className?: string }) {
  const t = await getTranslations("admin.delivery");
  const href = (d: string) => (d === today ? basePath : `${basePath}?d=${d}`);
  const long = dateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${day}T12:00:00`));
  return (
    <nav aria-label={t("runs.day")} className={cn("flex flex-wrap items-center gap-2 print:hidden", className)}>
      <Link href={href(shift(day, -1))} className={buttonVariants({ variant: "outline", size: "icon-sm" })} aria-label={t("runs.prevDay")}>
        <ChevronLeft className="rtl:-scale-x-100" />
      </Link>
      <Link href={href(shift(day, 1))} className={buttonVariants({ variant: "outline", size: "icon-sm" })} aria-label={t("runs.nextDay")}>
        <ChevronRight className="rtl:-scale-x-100" />
      </Link>
      <span className="text-sm font-medium">{long}</span>
      {day !== today && (
        <Link href={basePath} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {t("date.today")}
        </Link>
      )}
    </nav>
  );
}
