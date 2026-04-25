import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export default function CoverLayoutPreview3Icon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="2" y="2" width="16" height="16" rx="1.5" fill="#374151" />
      <polygon points="2,14 7,8 11,12 14,9 18,14" fill="#6b7280" />
      <circle cx="14" cy="6" r="2" fill="#9ca3af" />
      <rect
        x="2"
        y="14"
        width="16"
        height="4"
        rx="0"
        fill="#374151"
        opacity="0.7"
      />
      <rect
        x="6"
        y="15.5"
        width="8"
        height="1.5"
        rx="0.75"
        fill="#f9fafb"
        opacity="0.9"
      />
    </svg>
  );
}
