import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  contentClassName?: string;
};

export default function PageHeroBanner({
  children,
  contentClassName = "",
}: Props) {
  return (
    <div className="bg-primary-800 rounded-b-4xl  relative">
      <div className="absolute inset-0 overflow-hidden rounded-b-4xl pointer-events-none">
        <div className="absolute inset-0" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 0% 100%, rgba(255,255,255,0.18) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "10px 10px",
          }}
        />
      </div>

      <div
        className={`relative max-w-6xl mx-auto px-4 sm:px-8 ${contentClassName}`.trim()}
      >
        {children}
      </div>
    </div>
  );
}
