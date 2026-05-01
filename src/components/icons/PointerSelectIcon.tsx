import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export default function PointerSelectIcon(props: IconProps) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
