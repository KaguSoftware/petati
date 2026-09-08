"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { OverlayScroll } from "@/components/ui/overlay-scroll";
import { COUNTRIES, countryFlag, countryName } from "@/lib/phone/countries";

interface Props {
  id?: string;
  /** Hidden input name; submits a JSON array of ISO alpha-2 codes. */
  name: string;
  value: string[];
  onChange: (codes: string[]) => void;
  placeholder?: string;
}

/** Multi-select country chips (Base UI Combobox, `multiple`). Empty = every country. */
export function CountryChips({ id, name, value, onChange, placeholder }: Props) {
  const locale = useLocale();
  const t = useTranslations("common");
  const anchor = useComboboxAnchor();
  const items = useMemo(() => COUNTRIES.map((c) => c.code).sort((a, b) => countryName(a, locale).localeCompare(countryName(b, locale), locale)), [locale]);
  return (
    <>
      <Combobox<string, true> multiple items={items} value={value} onValueChange={(v) => onChange(v)} modal={false} itemToStringLabel={(code) => countryName(code, locale)}>
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(codes: string[]) => (
              <>
                {codes.map((code) => (
                  <ComboboxChip key={code} aria-label={countryName(code, locale)}>
                    <span aria-hidden>{countryFlag(code)}</span>
                    <span>{countryName(code, locale)}</span>
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput id={id} placeholder={codes.length ? "" : placeholder} autoComplete="off" />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>{t("noResults")}</ComboboxEmpty>
          <OverlayScroll className="max-h-[min(16rem,var(--available-height))]">
            <ComboboxList className="max-h-none overflow-visible">
              {(code: string) => (
                <ComboboxItem key={code} value={code}>
                  <span aria-hidden className="w-6 text-center">
                    {countryFlag(code)}
                  </span>
                  <span className="flex-1 truncate">{countryName(code, locale)}</span>
                  <span dir="ltr" className="font-mono text-xs text-muted-foreground">
                    {code}
                  </span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </OverlayScroll>
        </ComboboxContent>
      </Combobox>
      <input type="hidden" name={name} value={JSON.stringify(value)} />
    </>
  );
}
