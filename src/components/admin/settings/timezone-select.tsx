"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { OverlayScroll } from "@/components/ui/overlay-scroll";

interface Props {
  name: string;
  id?: string;
  defaultValue: string;
  required?: boolean;
  className?: string;
}

function zoneList(): string[] {
  try {
    const zones = Intl.supportedValuesOf("timeZone");
    return zones.includes("UTC") ? zones : ["UTC", ...zones];
  } catch {
    return ["UTC"];
  }
}

/** Searchable IANA time-zone picker (400+ entries) built on the Base UI Combobox. Submits the zone id. */
export function TimezoneSelect({ name, id, defaultValue, required, className }: Props) {
  const t = useTranslations("common");
  const items = useMemo(() => zoneList(), []);
  const initial = items.includes(defaultValue) ? defaultValue : (items[0] ?? "UTC");
  return (
    <Combobox<string> items={items} name={name} defaultValue={initial} required={required} modal={false} itemToStringLabel={(z) => z.replaceAll("_", " ")}>
      <ComboboxInput id={id} dir="ltr" className={className} autoComplete="off" />
      <ComboboxContent>
        <ComboboxEmpty>{t("noResults")}</ComboboxEmpty>
        <OverlayScroll className="max-h-[min(18rem,var(--available-height))]">
          <ComboboxList className="max-h-none overflow-visible">
            {(zone: string) => (
              <ComboboxItem key={zone} value={zone}>
                <span dir="ltr" className="truncate">
                  {zone.replaceAll("_", " ")}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </OverlayScroll>
      </ComboboxContent>
    </Combobox>
  );
}
