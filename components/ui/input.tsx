import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base text-[var(--color-text)] outline-none ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-offset-0 ${className}`.trim()}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
