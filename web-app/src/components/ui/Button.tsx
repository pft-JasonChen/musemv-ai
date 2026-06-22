import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = "primary", className = "", children, style, disabled, ...rest }: Props) {
  const base =
    "inline-flex items-center justify-center gap-1.5 h-[46px] px-5 rounded-xl text-[15px] font-bold transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:hover:brightness-100";
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
