import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initials } from "@/lib/admin/staff/format";
import type { OwnerProfile } from "@/lib/admin/staff/types";

/** Platform owners (implicit access everywhere). Rendered for owners only; read-only. */
export async function OwnersList({ owners }: { owners: OwnerProfile[] }) {
  const t = await getTranslations("admin.staff.owners");
  const tr = await getTranslations("admin.roles");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {owners.map((o) => (
          <div key={o.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
            <Avatar size="sm">
              {o.avatarUrl && <AvatarImage src={o.avatarUrl} alt="" />}
              <AvatarFallback>{initials(o.fullName, o.email)}</AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{o.fullName || o.email || "—"}</span>
              {o.fullName && (
                <span dir="ltr" className="truncate text-xs text-muted-foreground">
                  {o.email}
                </span>
              )}
            </span>
            <Badge variant="outline">{tr("owner")}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
