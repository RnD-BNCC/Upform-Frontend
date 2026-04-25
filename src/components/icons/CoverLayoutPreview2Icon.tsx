import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export default function CoverLayoutPreview2Icon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="11" y="3" width="7" height="14" rx="1" fill="#e5e7eb" />
      <rect x="2" y="6" width="7" height="2" rx="1" fill="#9ca3af" />
      <rect x="2" y="10" width="5" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="2" y="13" width="6" height="2" rx="1" fill="#374151" />
    </svg>
  );
}
