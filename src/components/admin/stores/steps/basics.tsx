"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { FormField } from "@/components/admin/shared/form-field";
import { Input } from "@/components/ui/input";
import { checkStoreSlugAction } from "@/lib/admin/stores/actions";
import { slugify } from "@/lib/admin/stores/defaults";
import { SLUG_RE } from "@/lib/admin/stores/schema";
import type { AvailabilityResult } from "@/lib/admin/stores/types";
import { cn } from "@/lib/utils";
import type { StepProps } from "./types";

interface Props extends StepProps {
  rootDomain: string;
  /** The root-domain store: its slug can never be reused. */
  defaultStoreSlug: string;
  slugTouched: boolean;
  onSlugTouched: () => void;
}

type SlugStatus = { kind: "idle" } | { kind: "checking" } | { kind: "ok" } | { kind: "error"; code: NonNullable<Extract<AvailabilityResult, { error: string }>["error"]> };

export function BasicsStep({ draft, update, errors, rootDomain, defaultStoreSlug, slugTouched, onSlugTouched }: Props) {
  const t = useTranslations("stores.basics");
  const [status, setStatus] = useState<SlugStatus>({ kind: "idle" });
  const slug = draft.slug ?? "";

  useEffect(() => {
    if (!slug) return;
    if (slug.length < 3 || !SLUG_RE.test(slug)) return;
    if (slug === defaultStoreSlug) {
      const id = setTimeout(() => setStatus({ kind: "error", code: "taken" }), 0);
      return () => clearTimeout(id);
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setStatus({ kind: "checking" });
      try {
        const res = await checkStoreSlugAction(slug);
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
  }, [slug, defaultStoreSlug]);

  const slugError = errors.slug;
  const statusLabel =
    status.kind === "checking"
      ? t("slugChecking")
      : status.kind === "ok"
        ? t("slugAvailable")
        : status.kind === "error"
          ? status.code === "taken"
            ? t("slugTaken")
            : status.code === "reserved"
              ? t("slugReserved")
              : t("slugInvalid")
          : null;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <FormField name="name" label={t("name")} errors={errors} required className="md:col-span-2">
        <Input
          id="name"
          value={draft.name}
          placeholder={t("namePlaceholder")}
          autoFocus
          maxLength={80}
          onChange={(e) => update({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
        />
      </FormField>

      <FormField name="slug" label={t("slug")} errors={errors} required description={t("slugHint")}>
        <div className="relative">
          <Input
            id="slug"
            dir="ltr"
            value={slug}
            maxLength={40}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={!!slugError || status.kind === "error" || undefined}
            onChange={(e) => {
              onSlugTouched();
              update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") });
            }}
            className="pe-8 font-mono text-sm"
          />
          <span className="pointer-events-none absolute inset-y-0 end-2.5 grid place-items-center">
            {status.kind === "checking" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            {status.kind === "ok" && !slugError && <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />}
            {status.kind === "error" && <CircleAlert className="size-4 text-destructive" />}
          </span>
        </div>
        {statusLabel && !slugError && (
          <p className={cn("text-xs", status.kind === "error" ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
            {statusLabel}
          </p>
        )}
      </FormField>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("slugPreview")}</span>
        <div dir="ltr" className="flex h-8 items-center truncate rounded-lg border border-dashed bg-muted/40 px-2.5 font-mono text-sm text-muted-foreground">
          <span className={cn(slug && "text-foreground")}>{slug || "your-store"}</span>
          <span>.{rootDomain}</span>
        </div>
      </div>

      <FormField name="tagline" label={t("tagline")} errors={errors} className="md:col-span-2">
        <Input id="tagline" value={draft.tagline ?? ""} maxLength={140} placeholder={t("taglinePlaceholder")} onChange={(e) => update({ tagline: e.target.value })} />
      </FormField>
    </div>
  );
}
