import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export default function SelectPreviewIcon(props: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" {...props}>
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
