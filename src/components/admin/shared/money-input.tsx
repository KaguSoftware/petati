"use client";

import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { toMajor } from "@/lib/money";
import { cn } from "@/lib/utils";

interface Props {
  id?: string;
  name: string;
  currency: string;
  /** Minor units (as stored). */
  defaultValue?: number | null;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Decimal amount input shown with the currency code. Submits the decimal string; server actions
 * convert with `moneyField(currency)` from lib/admin/validate.
 */
export function MoneyInput({ id, name, currency, defaultValue, required, disabled, placeholder, className }: Props) {
  const initial = defaultValue == null ? "" : String(toMajor(defaultValue, currency));
  return (
    <InputGroup className={cn(className)}>
      <InputGroupInput
        id={id}
        name={name}
        defaultValue={initial}
        required={required}
        disabled={disabled}
        placeholder={placeholder ?? "0.00"}
        inputMode="decimal"
        dir="ltr"
        autoComplete="off"
        className="text-start tabular-nums"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText className="text-xs font-medium tracking-wide uppercase">{currency}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}
