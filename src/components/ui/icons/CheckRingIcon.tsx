type Props = { size?: number; color?: string; className?: string };

export default function CheckRingIcon({ size = 48, color = "#10b981", className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 37 37"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="18.5"
        cy="18.5"
        r="13.875"
        fill={color}
        stroke="white"
        strokeWidth="2.5"
      />
      <path
        d="M12.3334 18.5L16.9584 23.125L24.6667 13.875"
        stroke="white"
        strokeWidth="2.5"
      />
    </svg>
  );
}
