import { FolderTree, ImageIcon, Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import type { CategoryAdminRow, CategoryOption } from "@/lib/admin/products/types";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { StatusBadge } from "../shared/status-badge";
import { CategoryDeleteButton, CategoryDialog } from "./category-dialog";
import { numberFormat } from "@/lib/number";

interface Props {
  rows: CategoryAdminRow[];
  storeId: string;
  locale: Locale;
  defaultLocale: Locale;
  enabledLocales: Locale[];
  canWrite: boolean;
}

/** Orders categories as a tree (parents first, children indented right after). */
function treeOrder(rows: CategoryAdminRow[]): (CategoryAdminRow & { depth: number })[] {
  const byParent = new Map<string | null, CategoryAdminRow[]>();
  for (const r of rows) byParent.set(r.parent_id, [...(byParent.get(r.parent_id) ?? []), r]);
  const out: (CategoryAdminRow & { depth: number })[] = [];
  const seen = new Set<string>();
  const walk = (parent: string | null, depth: number) => {
    for (const r of byParent.get(parent) ?? []) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push({ ...r, depth });
      walk(r.id, depth + 1);
    }
  };
  walk(null, 0);
  for (const r of rows) if (!seen.has(r.id)) out.push({ ...r, depth: 0 }); // orphans (parent in another store)
  return out;
}

export async function CategoryList({ rows, storeId, locale, defaultLocale, enabledLocales, canWrite }: Props) {
  const t = await getTranslations("admin");
  const num = numberFormat(locale);
  const parents: CategoryOption[] = rows.map((r) => ({ id: r.id, name: r.name, parentId: r.parent_id }));
  const ordered = treeOrder(rows);
  type Row = (typeof ordered)[number];
  const columns: Column<Row>[] = [
    {
      key: "name",
      header: t("categories.name"),
      cell: (r) => (
        <div className={cn("flex min-w-0 items-center gap-3", r.depth > 0 && "ps-6")} style={r.depth > 1 ? { paddingInlineStart: `${r.depth * 1.5}rem` } : undefined}>
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
            {r.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- storage host is user-configurable
              <img src={r.image_url} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
              <ImageIcon className="size-4" />
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
    { key: "parent", header: t("categories.parent"), cell: (r) => <span className="text-muted-foreground">{r.parentName ?? "—"}</span>, hideBelow: "md" },
    {
      key: "products",
      header: t("categories.products"),
      cell: (r) => (
        <Link href={`/admin/products?category=${r.id}`} className="tabular-nums hover:underline">
          {num.format(r.productCount)}
        </Link>
      ),
      className: "text-end",
      hideBelow: "sm",
    },
    { key: "sort", header: t("categories.sortOrder"), cell: (r) => <span className="text-muted-foreground tabular-nums">{num.format(r.sort_order)}</span>, className: "text-end", hideBelow: "lg" },
    { key: "active", header: t("common.status"), cell: (r) => <StatusBadge kind="store" value={r.is_active ? "active" : "inactive"} /> },
    ...(canWrite
      ? [
          {
            key: "actions",
            header: <span className="sr-only">{t("common.actions")}</span>,
            cell: (r: Row) => (
              <div className="flex items-center justify-end gap-0.5">
                <CategoryDialog
                  storeId={storeId}
                  locale={locale}
                  defaultLocale={defaultLocale}
                  enabledLocales={enabledLocales}
                  category={r}
                  parents={parents}
                  trigger={
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={t("common.edit")}>
                      <Pencil />
                    </Button>
                  }
                />
                <CategoryDeleteButton storeId={storeId} categoryId={r.id} productCount={r.productCount} />
              </div>
            ),
            className: "w-20 text-end",
          } satisfies Column<Row>,
        ]
      : []),
  ];
  return (
    <DataTable
      columns={columns}
      rows={ordered}
      rowKey={(r) => r.id}
      empty={
        <EmptyState
          icon={FolderTree}
          title={t("categories.empty")}
          description={t("categories.emptyHint")}
          action={
            canWrite ? (
              <CategoryDialog
                storeId={storeId}
                locale={locale}
                defaultLocale={defaultLocale}
                enabledLocales={enabledLocales}
                parents={parents}
                trigger={<Button type="button">{t("categories.new")}</Button>}
              />
            ) : null
          }
        />
      }
    />
  );
}
