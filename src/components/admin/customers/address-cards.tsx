import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import type { AddressRow } from "@/lib/db/types";

export async function AddressCards({ addresses }: { addresses: AddressRow[] }) {
  const t = await getTranslations("admin.customers");
  if (addresses.length === 0) return <p className="text-sm text-muted-foreground">{t("noAddresses")}</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {addresses.map((a) => (
        <li key={a.id} className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{a.label ?? a.full_name}</span>
            {a.is_default && (
              <Badge variant="outline" className="shrink-0">
                {t("default")}
              </Badge>
            )}
          </div>
          <address className="text-muted-foreground not-italic">
            {a.label ? (
              <>
                {a.full_name}
                <br />
              </>
            ) : null}
            {a.line1}
            {a.line2 ? (
              <>
                <br />
                {a.line2}
              </>
            ) : null}
            <br />
            {a.postal_code ? `${a.postal_code} ` : ""}
            {a.city}
            {a.region ? `, ${a.region}` : ""}
            <br />
            {a.country}
            {a.phone ? (
              <>
                <br />
                <span dir="ltr">{a.phone}</span>
              </>
            ) : null}
          </address>
        </li>
      ))}
    </ul>
  );
}
