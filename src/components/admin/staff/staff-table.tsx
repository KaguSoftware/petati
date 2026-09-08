"use client";

import { Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { startTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EffectiveRole } from "@/lib/db/types";
import { changeRoleAction, removeStaffAction } from "@/lib/admin/staff/actions";
import { initials } from "@/lib/admin/staff/format";
import { STORE_ROLES, type StaffMember } from "@/lib/admin/staff/types";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { useActionToast } from "../shared/use-action-toast";

interface Props {
  storeId: string;
  locale: string;
  rows: StaffMember[];
  /** The signed-in admin: managers cannot edit or remove themselves. */
  actor: { id: string; role: EffectiveRole };
  inviteButton?: React.ReactNode;
}

export function StaffTable({ storeId, locale, rows, actor, inviteButton }: Props) {
  const t = useTranslations("admin.staff");
  const tr = useTranslations("admin.roles");
  const tc = useTranslations("admin.common");
  const [, roleAction, rolePending] = useActionToast(changeRoleAction, { errorNamespace: "admin.staff" });
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  // Base UI SelectValue renders the raw value unless items carry labels.
  const roleItems = STORE_ROLES.map((r) => ({ value: r, label: tr(r) }));

  function changeRole(userId: string, role: string) {
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("userId", userId);
    fd.set("role", role);
    startTransition(() => roleAction(fd));
  }

  const columns: Column<StaffMember>[] = [
    {
      key: "member",
      header: t("member"),
      cell: (m) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar size="sm">
            {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt="" />}
            <AvatarFallback>{initials(m.fullName, m.email)}</AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{m.fullName || t("noName")}</span>
            <span dir="ltr" className="truncate text-xs text-muted-foreground">
              {m.email ?? "—"}
            </span>
            {m.userId === actor.id && <span className="text-xs text-muted-foreground">({t("you")})</span>}
          </span>
        </span>
      ),
    },
    {
      key: "role",
      header: t("role"),
      className: "w-44",
      cell: (m) => {
        const locked = actor.role !== "owner" && m.userId === actor.id;
        return (
          <Select items={roleItems} value={m.role} onValueChange={(v) => v && v !== m.role && changeRole(m.userId, String(v))} disabled={locked || rolePending} modal={false}>
            <SelectTrigger size="sm" aria-label={t("role")} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {STORE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {tr(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    { key: "joined", header: t("joined"), hideBelow: "md", className: "text-muted-foreground tabular-nums", cell: (m) => dateFmt.format(new Date(m.joinedAt)) },
    {
      key: "actions",
      header: <span className="sr-only">{tc("actions")}</span>,
      className: "w-0 text-end",
      cell: (m) => {
        const locked = actor.role !== "owner" && m.userId === actor.id;
        return (
          <ConfirmDialog
            trigger={
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t("remove")} disabled={locked} className="text-destructive hover:text-destructive">
                <Trash2 />
              </Button>
            }
            title={t("removeTitle")}
            description={t("removeDescription", { name: m.fullName || m.email || "" })}
            confirmLabel={t("remove")}
            destructive
            action={async () => {
              const fd = new FormData();
              fd.set("storeId", storeId);
              fd.set("userId", m.userId);
              const res = await removeStaffAction({}, fd);
              // ConfirmDialog only resolves admin.common error keys; translate module keys here.
              return res.error && t.has(`errors.${res.error}`) ? { error: t(`errors.${res.error}`) } : res;
            }}
          />
        );
      },
    },
  ];

  return <DataTable columns={columns} rows={rows} rowKey={(m) => m.userId} empty={<EmptyState icon={Users} title={t("emptyTitle")} description={t("emptyHint")} action={inviteButton} />} />;
}
