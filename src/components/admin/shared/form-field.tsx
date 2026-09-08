import { useTranslations } from "next-intl";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface Props {
  /** Input id and the key looked up in `fieldErrors`. */
  name: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  /** `fieldErrors` from the action state; message keys resolve under admin.common, raw text otherwise. */
  errors?: Record<string, string>;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + description + error, wired to the `fieldErrors` convention. */
export function FormField({ name, label, description, errors, required, className, children }: Props) {
  const t = useTranslations("admin.common");
  const raw = errors?.[name];
  const message = raw ? (t.has(raw) ? t(raw) : raw) : undefined;
  return (
    <Field className={cn(className)} data-invalid={message ? "" : undefined}>
      <FieldLabel htmlFor={name}>
        {label}
        {required && <span aria-hidden className="text-destructive">*</span>}
      </FieldLabel>
      {children}
      {description && !message && <FieldDescription>{description}</FieldDescription>}
      {message && <FieldError>{message}</FieldError>}
    </Field>
  );
}
