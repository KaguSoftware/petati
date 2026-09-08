"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, CircleAlert, Globe, Loader2 } from "lucide-react";
import { FormField } from "@/components/admin/shared/form-field";
import { Input } from "@/components/ui/input";
import { checkHostnameAction } from "@/lib/admin/stores/actions";
import { HOSTNAME_RE, hostnameConflictsWithRoot } from "@/lib/admin/stores/schema";
import type { AvailabilityResult } from "@/lib/admin/stores/types";
import { cn } from "@/lib/utils";
import type { StepProps } from "./types";

interface Props extends StepProps {
  rootDomain: string;
}

type HostStatus = { kind: "idle" } | { kind: "checking" } | { kind: "ok" } | { kind: "error"; code: Extract<AvailabilityResult, { error: string }>["error"] };

export function DomainStep({ draft, update, errors, rootDomain }: Props) {
  const t = useTranslations("stores.domain");
  const hostname = (draft.customDomain ?? "").trim().toLowerCase();
  const [status, setStatus] = useState<HostStatus>({ kind: "idle" });

  useEffect(() => {
    if (!hostname) return;
    if (!HOSTNAME_RE.test(hostname)) return;
    if (hostnameConflictsWithRoot(hostname, rootDomain)) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setStatus({ kind: "checking" });
      try {
        const res = await checkHostnameAction(hostname);
        if (cancelled) return;
        setStatus("ok" in res ? { kind: "ok" } : { kind: "error", code: res.error });
      } catch {
        if (!cancelled) setStatus({ kind: "idle" });
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hostname, rootDomain]);

  const localInvalid = hostname !== "" && !HOSTNAME_RE.test(hostname);
  const localRoot = hostname !== "" && !localInvalid && hostnameConflictsWithRoot(hostname, rootDomain);
  const shown: HostStatus = hostname === "" ? { kind: "idle" } : localInvalid ? { kind: "error", code: "invalid" } : localRoot ? { kind: "error", code: "rootDomain" } : status;
  const statusLabel =
    shown.kind === "checking" ? t("checking") : shown.kind === "ok" ? t("available") : shown.kind === "error" ? (shown.code === "taken" ? t("taken") : shown.code === "rootDomain" ? t("rootDomain") : t("invalid")) : null;
  const target = rootDomain.split(":")[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("subdomain")}</span>
        <div dir="ltr" className="flex h-9 items-center gap-2 truncate rounded-lg border bg-muted/40 px-3 font-mono text-sm">
          <Globe className="size-4 shrink-0 text-muted-foreground" />
          <span>
            {draft.slug || "your-store"}.{rootDomain}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t("subdomainHint")}</p>
      </div>

      <FormField name="customDomain" label={t("custom")} errors={errors} description={t("customHint")}>
        <div className="relative">
          <Input
            id="customDomain"
            dir="ltr"
            value={draft.customDomain ?? ""}
            placeholder={t("customPlaceholder")}
            maxLength={253}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={!!errors.customDomain || shown.kind === "error" || undefined}
            onChange={(e) => update({ customDomain: e.target.value.toLowerCase().trim() })}
            className="pe-8 font-mono text-sm"
          />
          <span className="pointer-events-none absolute inset-y-0 end-2.5 grid place-items-center">
            {shown.kind === "checking" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            {shown.kind === "ok" && <CheckCircle2 className="size-4 text-emerald-600" />}
            {shown.kind === "error" && <CircleAlert className="size-4 text-destructive" />}
          </span>
        </div>
        {statusLabel && !errors.customDomain && (
          <p className={cn("text-xs", shown.kind === "error" ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
            {statusLabel}
          </p>
        )}
      </FormField>

      {hostname && shown.kind !== "error" && (
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">{t("dnsTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("dnsHint")}</p>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">{t("dnsType")}</dt>
            <dd className="font-mono" dir="ltr">
              CNAME
            </dd>
            <dt className="text-muted-foreground">{t("dnsName")}</dt>
            <dd className="truncate font-mono" dir="ltr">
              {hostname}
            </dd>
            <dt className="text-muted-foreground">{t("dnsValue")}</dt>
            <dd className="truncate font-mono" dir="ltr">
              {target}
            </dd>
          </dl>
        </div>
      )}
    </div>
  );
}
