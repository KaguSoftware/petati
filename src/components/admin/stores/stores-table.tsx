import { getTranslations } from "next-intl/server";
import { Store } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/shared/data-table";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { StoreListItem } from "@/lib/admin/stores/types";
import { env } from "@/lib/env";
import { customDomainUrl, storefrontUrl, subdomainHost } from "@/lib/tenant/urls";
import { StoreRowActions } from "./store-row-actions";
import { dateTimeFormat } from "@/lib/number";

interface Props {
  rows: StoreListItem[];
  locale: string;
}

/** Server-rendered stores list; per-row menu is a client island. */
export async function StoresTable({ rows, locale }: Props) {
  const t = await getTranslations("stores");
  const ts = await getTranslations("admin.common");
  const date = dateTimeFormat(locale, { dateStyle: "medium" });
  const rootDomain = env.rootDomain();
  const defaultSlug = env.defaultStoreSlug();

  const columns: Column<StoreListItem>[] = [
    {
      key: "store",
      header: t("columns.store"),
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="rounded-lg after:rounded-lg">
            {/* bg-white is deliberate in both schemes: merchant logos are usually dark-on-transparent. */}
            {r.logo_url && <AvatarImage src={r.logo_url} alt="" className="rounded-lg bg-white object-contain" />}
            <AvatarFallback className="rounded-lg">
              <Store className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2 truncate font-medium">
              {r.name}
              {r.slug === defaultSlug && <Badge variant="secondary">{t("defaultStore")}</Badge>}
            </span>
            <span className="truncate font-mono text-xs text-muted-foreground" dir="ltr">
              {r.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "domain",
      header: t("columns.domain"),
      cell: (r) => {
        const primary = r.domains.find((d) => d.is_primary) ?? r.domains[0];
        const host = primary ? primary.hostname : r.slug === defaultSlug ? rootDomain : subdomainHost(r.slug);
        const href = primary ? customDomainUrl(primary.hostname, r.default_locale) : storefrontUrl(r.slug, r.default_locale);
        return (
          <a href={href} target="_blank" rel="noreferrer" dir="ltr" className="truncate font-mono text-xs hover:underline">
            {host}
          </a>
        );
      },
      hideBelow: "md",
    },
    { key: "currency", header: t("columns.currency"), cell: (r) => <span className="tabular-nums">{r.currency}</span>, hideBelow: "lg" },
    {
      key: "locales",
      header: t("columns.locales"),
      cell: (r) => (
        <span className="flex flex-wrap gap-1">
          {r.enabled_locales.map((l) => (
            <Badge key={l} variant={l === r.default_locale ? "default" : "outline"} className="font-mono uppercase">
              {l}
            </Badge>
          ))}
        </span>
      ),
      hideBelow: "lg",
    },
    { key: "status", header: ts("status"), cell: (r) => <StatusBadge kind="store" value={r.is_active ? "active" : "inactive"} /> },
    { key: "created", header: t("columns.created"), cell: (r) => <span className="text-muted-foreground tabular-nums">{date.format(new Date(r.created_at))}</span>, hideBelow: "xl" },
    {
      key: "actions",
      header: <span className="sr-only">{ts("actions")}</span>,
      cell: (r) => <StoreRowActions store={r} storefrontUrl={storefrontUrl(r.slug, r.default_locale)} isDefault={r.slug === defaultSlug} rootDomain={rootDomain} />,
      className: "w-10 text-end",
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      empty={
        <EmptyState
          icon={Store}
          title={t("empty")}
          description={t("emptyHint")}
          action={
            <Link href="/admin/stores/new" className={buttonVariants()}>
              {t("create")}
            </Link>
          }
        />
      }
    />
  );
}
