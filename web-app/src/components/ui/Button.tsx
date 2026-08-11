import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = "primary", className = "", children, style, disabled, ...rest }: Props) {
  // Designer request, 2026-08-11: every filled/bordered action button must be
  // a pill (999px), default and hover alike — `rounded-xl` (12px) on a 46px
  // button read as a rounded rectangle, not the pill shape used everywhere
  // else in this design system (DP's own `.button`, `.icon-button`, `.chip`
  // all key off `--radius-pill`). Same defect `CommunityMvPlayer.tsx` already
  // found and moved off this component for its own CTA (see its comment).
  const base =
    "inline-flex items-center justify-center gap-1.5 h-[46px] px-5 rounded-full text-[15px] font-bold transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:hover:brightness-100";
  const styles: Record<Variant, React.CSSProperties> = {
    primary: {
      background: "var(--mv-grad)",
      color: "#fff",
      boxShadow: "var(--shadow-cta)",
      opacity: disabled ? 0.4 : 1,
    },
    secondary: {
      background: "var(--card-2)",
      color: "var(--text)",
      opacity: disabled ? 0.4 : 1,
    },
    ghost: {
      background: "transparent",
      color: "var(--text-2)",
      border: "1.5px solid var(--border-2)",
      opacity: disabled ? 0.4 : 1,
    },
  };
  return (
    <button className={`${base} ${className}`} style={{ ...styles[variant], ...style }} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
