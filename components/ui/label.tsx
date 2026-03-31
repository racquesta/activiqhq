import { type LabelHTMLAttributes } from "react";

export function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)] ${className}`.trim()}
      {...props}
    />
  );
}
