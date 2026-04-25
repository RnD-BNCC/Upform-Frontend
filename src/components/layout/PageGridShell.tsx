import type { CSSProperties, ReactNode } from "react";

const PAGE_GRID_SHELL_STYLE: CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(0,84,165,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,84,165,0.06) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
};

type Props = {
  children: ReactNode;
  className?: string;
};

export default function PageGridShell({ children, className = "" }: Props) {
  return (
    <div
      className={`min-h-screen bg-gray-50 flex flex-col ${className}`.trim()}
      style={PAGE_GRID_SHELL_STYLE}
    >
      {children}
    </div>
  );
}

