import type { useTranslations } from "next-intl";

type T = ReturnType<typeof useTranslations<"admin.settings">>;

/**
 * `FormField` resolves message keys under admin.common only; settings-specific keys
 * (`admin.settings.fieldErrors.*`) are translated here before they reach the field.
 */
export function translateFieldErrors(errors: Record<string, string> | undefined, t: T): Record<string, string> | undefined {
  if (!errors) return errors;
  const out: Record<string, string> = {};
  for (const [field, key] of Object.entries(errors)) out[field] = t.has(`fieldErrors.${key}`) ? t(`fieldErrors.${key}`) : key;
  return out;
}
