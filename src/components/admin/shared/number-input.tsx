"use client";

import { NumberField } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  id?: string;
  name?: string;
  defaultValue?: number | null;
  value?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  disabled?: boolean;
  /** Intl format options (e.g. `{ style: "percent" }`). */
  format?: Intl.NumberFormatOptions;
  className?: string;
  "aria-label"?: string;
}

const btn =
  "grid size-8 shrink-0 place-items-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 [&_svg]:size-3.5";

/** Custom numeric input with −/+ buttons (replaces native `type="number"`). */
export function NumberInput({ className, format, defaultValue, ...props }: Props) {
  return (
    <NumberField.Root {...props} defaultValue={defaultValue ?? undefined} format={format} className={cn("w-full", className)}>
      <NumberField.Group className="flex h-8 w-full items-stretch overflow-hidden rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
        <NumberField.Decrement className={cn(btn, "border-e")}>
          <Minus />
        </NumberField.Decrement>
        <NumberField.Input dir="ltr" className="min-w-0 flex-1 bg-transparent px-2 text-center text-sm outline-none tabular-nums" />
        <NumberField.Increment className={cn(btn, "border-s")}>
          <Plus />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}
