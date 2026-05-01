import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export default function ConditionalLogicIcon(props: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M6 3v6m0 0c0 3 3 3 6 3h6M6 9c0 3-3 3-6 0M18 9v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
