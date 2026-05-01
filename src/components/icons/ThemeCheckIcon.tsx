import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export default function ThemeCheckIcon(props: IconProps) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M5 12l5 5 9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
