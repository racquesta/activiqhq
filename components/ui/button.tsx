import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", type = "button", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-medium transition-colors rounded-[var(--radius-button)] px-4 py-2.5 text-base disabled:pointer-events-none disabled:opacity-50";
    const variants =
      variant === "primary"
        ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]"
        : "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-[var(--shadow-card)] hover:bg-[var(--color-bg)]";
    return (
      <button ref={ref} type={type} className={`${base} ${variants} ${className}`.trim()} {...props} />
    );
  }
);

Button.displayName = "Button";
