import { BadgeCheck, Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { BrandAdminRow } from "@/lib/admin/brands/types";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { BrandActiveSwitch, BrandDeleteButton, BrandDialog } from "./brand-dialog";
import { numberFormat } from "@/lib/number";

interface Props {
  rows: BrandAdminRow[];
  storeId: string;
  locale: string;
  canWrite: boolean;
}

/** "Royal Canin" → "RC" for the logo placeholder. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export async function BrandList({ rows, storeId, locale, canWrite }: Props) {
  const t = await getTranslations("admin");
  const num = numberFormat(locale);
  const columns: Column<BrandAdminRow>[] = [
    {
      key: "name",
      header: t("brands.name"),
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted text-xs font-semibold text-muted-foreground">
            {r.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- storage host is user-configurable
              <img src={r.logo_url} alt="" className="size-full object-contain p-0.5" loading="lazy" />
            ) : (
              initials(r.name)
            )}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{r.name}</span>
            <span className="truncate text-xs text-muted-foreground" dir="ltr">
              /{r.slug}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: "products",
      header: t("brands.products"),
      cell: (r) => (
        <Link href={`/admin/products?brand=${r.id}`} className="tabular-nums hover:underline">
          {num.format(r.productCount)}
        </Link>
      ),
      className: "text-end",
      hideBelow: "sm",
    },
    { key: "sort", header: t("brands.sortOrder"), cell: (r) => <span className="text-muted-foreground tabular-nums">{num.format(r.sort_order)}</span>, className: "text-end", hideBelow: "lg" },
    {
      key: "active",
      header: t("brands.active"),
      cell: (r) => <BrandActiveSwitch storeId={storeId} brandId={r.id} checked={r.is_active} disabled={!canWrite} />,
      className: "text-center",
    },
    ...(canWrite
      ? [
          {
            key: "actions",
            header: <span className="sr-only">{t("common.actions")}</span>,
            cell: (r: BrandAdminRow) => (
              <div className="flex items-center justify-end gap-0.5">
                <BrandDialog
                  storeId={storeId}
                  brand={r}
                  trigger={
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={t("common.edit")}>
                      <Pencil />
                    </Button>
                  }
                />
                <BrandDeleteButton storeId={storeId} brandId={r.id} productCount={r.productCount} />
              </div>
            ),
            className: "w-20 text-end",
          } satisfies Column<BrandAdminRow>,
        ]
      : []),
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      empty={
        <EmptyState
          icon={BadgeCheck}
          title={t("brands.empty")}
          description={t("brands.emptyHint")}
          action={canWrite ? <BrandDialog storeId={storeId} trigger={<Button type="button">{t("brands.new")}</Button>} /> : null}
        />
      }
    />
  );
}
