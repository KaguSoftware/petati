"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { STEP_ORDER, type WizardStep } from "@/lib/admin/stores/schema";
import { cn } from "@/lib/utils";

interface Props {
  current: number;
  /** Highest step index the user has reached; steps up to it are clickable. */
  reached: number;
  onSelect: (index: number) => void;
  className?: string;
}

/** Horizontal step indicator. Logical spacing only, so it mirrors correctly in RTL. */
export function WizardStepper({ current, reached, onSelect, className }: Props) {
  const t = useTranslations("stores");
  return (
    <nav aria-label={t("wizard.title")} className={cn("flex flex-col gap-2", className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
        {STEP_ORDER.map((step: WizardStep, i) => {
          const done = i < current;
          const active = i === current;
          const enabled = i <= reached;
          return (
            <li key={step} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!enabled}
                onClick={() => onSelect(i)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  enabled ? "hover:bg-muted" : "cursor-default",
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border text-xs tabular-nums",
                    active && "border-primary bg-primary text-primary-foreground",
                    done && "border-primary/40 bg-primary/10 text-primary",
                    !active && !done && "border-border",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={cn("hidden sm:inline", active && "inline")}>{t(`steps.${step}`)}</span>
              </button>
              {i < STEP_ORDER.length - 1 && <span aria-hidden className="hidden h-px w-4 bg-border md:block" />}
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground sm:hidden">{t("wizard.stepOf", { step: current + 1, total: STEP_ORDER.length })}</p>
    </nav>
  );
}
