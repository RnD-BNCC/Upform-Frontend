import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  color: string;
};

export default function MapPinMarkerIcon({
  color,
  ...props
}: IconProps) {
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none" {...props}>
      <path
        d="M10 0C4.477 0 0 4.477 0 10C0 16.5 10 24 10 24C10 24 20 16.5 20 10C20 4.477 15.523 0 10 0Z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="10" r="4" fill="white" fillOpacity="0.6" />
    </svg>
  );
}
