import { CircleAlert } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";
import { Label } from "./label";

/**
 * Label + control + hint/error, wired for screen readers. Pass exactly one form control as the child.
 *
 *   <Field label="Amount" hint="Up to ₹1,00,000 a day" error={errors.amount?.message}>
 *     <Input inputMode="decimal" {...register("amount")} />
 *   </Field>
 */
export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  /** Shown after the label, e.g. "Optional". */
  labelSuffix?: string;
  className?: string;
  children: React.ReactElement<Record<string, unknown>>;
}

export function Field({
  label,
  hint,
  error,
  labelSuffix,
  className,
  children,
}: FieldProps) {
  const id = React.useId();
  const controlId =
    (children.props.id as string | undefined) ?? `${id}-control`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div data-slot="field" className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={controlId}>{label}</Label>
        {labelSuffix && (
          <span className="text-caption text-subtle-foreground">
            {labelSuffix}
          </span>
        )}
      </div>
      {React.cloneElement(children, {
        id: controlId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {error ? (
        <p
          id={errorId}
          className="flex items-center gap-1.5 text-caption text-danger-foreground"
        >
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-caption text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
