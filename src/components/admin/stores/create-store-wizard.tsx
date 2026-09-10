"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { createStoreAction } from "@/lib/admin/stores/actions";
import { defaultDraft, DRAFT_STORAGE_KEY } from "@/lib/admin/stores/defaults";
import { issuesToFieldErrors, STEP_ORDER, STEP_SCHEMAS, stepForPath, type CreateStoreInput, type WizardStep } from "@/lib/admin/stores/schema";
import type { ActionState } from "@/lib/admin/types";
import type { SectionKey, VariantKey } from "@/lib/theme/types";
import { BasicsStep } from "./steps/basics";
import { BrandingStep } from "./steps/branding";
import { ContactStep } from "./steps/contact";
import { DesignStep } from "./steps/design";
import { DomainStep } from "./steps/domain";
import { LocalesMoneyStep } from "./steps/locales-money";
import { ReviewStep } from "./steps/review";
import { WizardStepper } from "./wizard-stepper";



interface Props {
  locale: string;
  rootDomain: string;
  defaultStoreSlug: string;
  showPreviewLinks: boolean;
  variants: Record<SectionKey, VariantKey[]>;
  /** Composed home page per design language (server-rendered with sample data). */
  presetPreviews: Record<VariantKey, React.ReactNode[]>;
}

interface StoredDraft {
  draft: CreateStoreInput;
  step: number;
  reached: number;
  slugTouched: boolean;
}

/**
 * Multi-step "create a new website" flow. Draft state mirrors to sessionStorage (files excluded)
 * so a reload does not lose work. Each step validates with its zod schema before advancing; the
 * server re-validates everything and its field errors jump back to the owning step.
 * Reachable only by platform owners (stores/layout.tsx gate).
 */
export function CreateStoreWizard({ locale, rootDomain, defaultStoreSlug, showPreviewLinks, variants, presetPreviews }: Props) {
  const t = useTranslations("stores");
  const tErr = useTranslations("stores.fieldErrors");
  const tCommon = useTranslations("admin.common");
  const [draft, setDraft] = useState<CreateStoreInput>(defaultDraft);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [slugTouched, setSlugTouched] = useState(false);
  const [rawErrors, setRawErrors] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [state, formAction, pending] = useActionState(createStoreAction, {} as ActionState);
  const seenState = useRef<ActionState | null>(null);

  // Restore a draft after mount (sessionStorage is browser-only, so this cannot run during SSR).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<StoredDraft>;
        if (saved.draft) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from storage
          setDraft({ ...defaultDraft(), ...saved.draft });
          setStep(Math.min(saved.step ?? 0, STEP_ORDER.length - 1));
          setReached(Math.min(saved.reached ?? 0, STEP_ORDER.length - 1));
          setSlugTouched(!!saved.slugTouched);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ draft, step, reached, slugTouched } satisfies StoredDraft));
    } catch {
      // storage full / unavailable
    }
  }, [draft, step, reached, slugTouched, hydrated]);

  // Server-side validation failures: show them on the step that owns the first field.
  useEffect(() => {
    if (state === seenState.current) return;
    seenState.current = state;
    if (state.fieldErrors && Object.keys(state.fieldErrors).length) {
      const first = Object.keys(state.fieldErrors)[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to a new action result
      setRawErrors(state.fieldErrors);
      if (first === "logo") setStep(STEP_ORDER.indexOf("branding"));
      else if (first !== "_") setStep(STEP_ORDER.indexOf(stepForPath(first)));
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [key, code] of Object.entries(rawErrors)) out[key] = tErr.has(code) ? tErr(code) : tCommon.has(code) ? tCommon(code) : code;
    return out;
  }, [rawErrors, tErr, tCommon]);

  function update(patch: Partial<CreateStoreInput>) {
    setDraft((d) => ({ ...d, ...patch }));
    const keys = Object.keys(patch);
    if (keys.some((k) => rawErrors[k] || Object.keys(rawErrors).some((e) => e.startsWith(`${k}.`)))) {
      setRawErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([e]) => !keys.some((k) => e === k || e.startsWith(`${k}.`)))));
    }
  }

  function onLogoChange(file: File | null) {
    setLogo(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
    setRawErrors((prev) => {
      if (!prev.logo) return prev;
      const rest = { ...prev };
      delete rest.logo;
      return rest;
    });
  }

  function validate(index: number): boolean {
    const key = STEP_ORDER[index];
    if (key === "review") return true;
    const res = STEP_SCHEMAS[key].safeParse(draft);
    if (res.success) return true;
    setRawErrors(issuesToFieldErrors(res.error.issues));
    return false;
  }

  function goTo(index: number) {
    if (index > step && !validate(step)) return;
    setStep(index);
    setReached((r) => Math.max(r, index));
  }

  function submit() {
    if (pending) return;
    for (let i = 0; i < STEP_ORDER.length - 1; i += 1) {
      if (!validate(i)) {
        setStep(i);
        return;
      }
    }
    const enabled = draft.enabledLocales as Locale[];
    const payload: CreateStoreInput = {
      ...draft,
      announcement: Object.fromEntries(Object.entries(draft.announcement ?? {}).filter(([l, v]) => enabled.includes(l as Locale) && v && v.trim())),
    };
    const fd = new FormData();
    fd.set("payload", JSON.stringify(payload));
    fd.set("locale", locale);
    if (logo) fd.set("logo", logo, logo.name);
    startTransition(() => formAction(fd));
  }

  const current = STEP_ORDER[step];
  const errorMessage = state.error && state.error !== "invalid" ? (t.has(`errors.${state.error}`) ? t(`errors.${state.error}`) : tCommon.has(`errors.${state.error}`) ? tCommon(`errors.${state.error}`) : t("wizard.genericError")) : Object.keys(rawErrors).length ? t("wizard.errorBanner") : null;

  return (
    // Not a <form>: the design step embeds storefront previews that carry forms of their own, and forms
    // must not nest. Enter inside a text input still advances the step.
    <div
      className="flex flex-col gap-6"
      onKeyDown={(e) => {
        if (e.key !== "Enter" || current === "review") return;
        const el = e.target as HTMLElement;
        if (el.tagName !== "INPUT" || (el as HTMLInputElement).type === "file") return;
        e.preventDefault();
        goTo(step + 1);
      }}
    >
      <WizardStepper current={step} reached={reached} onSelect={goTo} />

      <section className="rounded-xl border bg-card p-4 md:p-6" aria-labelledby="wizard-step-title">
        <h2 id="wizard-step-title" className="mb-5 text-lg font-semibold">
          {t(`steps.${current}`)}
        </h2>
        {current === "basics" && <BasicsStep draft={draft} update={update} errors={errors} rootDomain={rootDomain} defaultStoreSlug={defaultStoreSlug} slugTouched={slugTouched} onSlugTouched={() => setSlugTouched(true)} />}
        {current === "localesMoney" && <LocalesMoneyStep draft={draft} update={update} errors={errors} />}
        {current === "branding" && <BrandingStep draft={draft} update={update} errors={errors} logoPreview={logoPreview} logoName={logo?.name ?? null} onLogoChange={onLogoChange} />}
        {current === "design" && <DesignStep draft={draft} update={update} errors={errors} locale={locale} variants={variants} showPreviewLinks={showPreviewLinks} presetPreviews={presetPreviews} />}
        {current === "contact" && <ContactStep draft={draft} update={update} errors={errors} />}
        {current === "domain" && <DomainStep draft={draft} update={update} errors={errors} rootDomain={rootDomain} />}
        {current === "review" && (
          <ReviewStep draft={draft} rootDomain={rootDomain} logoPreview={logoPreview} errorMessage={errorMessage} pending={pending} onEdit={(s: WizardStep) => goTo(STEP_ORDER.indexOf(s))} onSubmit={submit} />
        )}
      </section>

      {current !== "review" && (
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => goTo(step - 1)} disabled={step === 0}>
            <ArrowLeft data-icon="inline-start" className="rtl:-scale-x-100" />
            {t("wizard.back")}
          </Button>
          <span className="hidden text-xs text-muted-foreground sm:block">{t("wizard.stepOf", { step: step + 1, total: STEP_ORDER.length })}</span>
          <Button type="button" onClick={() => goTo(step + 1)}>
            {t("wizard.next")}
            <ArrowRight data-icon="inline-end" className="rtl:-scale-x-100" />
          </Button>
        </div>
      )}
      {current === "review" && (
        <div className="flex items-center justify-start">
          <Button type="button" variant="outline" onClick={() => goTo(step - 1)}>
            <ArrowLeft data-icon="inline-start" className="rtl:-scale-x-100" />
            {t("wizard.back")}
          </Button>
        </div>
      )}
    </div>
  );
}
