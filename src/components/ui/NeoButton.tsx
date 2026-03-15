import type { ReactNode } from "react";

type NeoButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
  href?: string;
  onClick?: () => void;
};

const VARIANT: Record<NonNullable<NeoButtonProps["variant"]>, string> = {
  primary:
    "bg-primary-500 text-white border-2 border-primary-900 shadow-[4px_4px_0px_0px_#001d3a] hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0px_0px_#001d3a] active:translate-x-1 active:translate-y-1 active:shadow-none",
  secondary:
    "bg-white text-primary-700 border-2 border-primary-700 shadow-[4px_4px_0px_0px_#003b76] hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0px_0px_#003b76] active:translate-x-1 active:translate-y-1 active:shadow-none",
};

const BASE =
  "inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-bold tracking-wide transition-all duration-150 select-none cursor-pointer";

export function NeoButton({
  children,
  className = "",
  variant = "primary",
  href,
  onClick,
}: NeoButtonProps) {
  const classes = `${BASE} ${VARIANT[variant]} ${className}`;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
