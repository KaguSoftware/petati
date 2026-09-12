import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import { Link } from "@/i18n/navigation";
import type { ReviewListRow } from "@/lib/admin/reviews/types";
import type { ReviewStatus } from "@/lib/db/types";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { ReviewActions } from "./review-actions";
import { dateTimeFormat } from "@/lib/number";

interface Props {
  rows: ReviewListRow[];
  storeId: string;
  locale: string;
  status: ReviewStatus;
}

export async function ReviewsTable({ rows, storeId, locale, status }: Props) {
  const t = await getTranslations("admin.reviews");
  const ts = await getTranslations("admin.status.review");
  const tc = await getTranslations("admin.common");
  const date = dateTimeFormat(locale, { dateStyle: "medium" });
  const columns: Column<ReviewListRow>[] = [
    {
      key: "product",
      header: t("product"),
      cell: (r) => (
        <div className="flex min-w-0 flex-col gap-1">
          <Link href={`/admin/products/${r.product_id}`} className="truncate font-medium hover:underline">
            {r.product_name}
          </Link>
          {/* RatingStars paints with the storefront's accent token; the admin theme has none, so give it amber here. */}
          <span className="text-amber-500 [&_svg.fill-accent]:fill-current [&_svg.text-accent]:text-current">
            <RatingStars value={r.rating} />
          </span>
        </div>
      ),
      className: "max-w-48",
    },
    {
      key: "review",
      header: t("review"),
      cell: (r) => (
        <div className="flex min-w-0 max-w-md flex-col gap-0.5">
          <span className={r.title ? "font-medium" : "text-muted-foreground italic"}>{r.title ?? t("noTitle")}</span>
          {r.body && <p className="line-clamp-3 text-sm whitespace-pre-line text-muted-foreground">{r.body}</p>}
          <span className="mt-1 text-xs text-muted-foreground md:hidden">
            {r.author_name ?? r.author_email ?? t("anonymous")} · {date.format(new Date(r.created_at))}
          </span>
        </div>
      ),
    },
    {
      key: "author",
      header: t("author"),
      cell: (r) => (
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate">{r.author_name ?? r.author_email ?? t("anonymous")}</span>
          {r.author_name && r.author_email && (
            <span className="truncate text-xs text-muted-foreground" dir="ltr">
              {r.author_email}
            </span>
          )}
          {r.is_verified_purchase && (
            <Badge variant="outline" className="w-fit gap-1 border-transparent bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="size-3" />
              {t("verified")}
            </Badge>
          )}
        </div>
      ),
      hideBelow: "md",
    },
    {
      key: "date",
      header: tc("date"),
      cell: (r) => <span className="text-muted-foreground tabular-nums">{date.format(new Date(r.created_at))}</span>,
      hideBelow: "lg",
    },
    { key: "actions", header: "", cell: (r) => <ReviewActions storeId={storeId} reviewId={r.id} status={r.status} />, className: "text-end" },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      empty={<EmptyState title={t("empty", { status: ts(status).toLowerCase() })} description={t("emptyHint")} />}
    />
  );
}
