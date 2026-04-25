type Props = {
  size: number;
  radius: number;
  strokeWidth: number;
  circumference: number;
  dashOffset: number;
  color: string;
};

export default function TimerRingSvg({
  size,
  radius,
  strokeWidth,
  circumference,
  dashOffset,
  color,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      className="-rotate-90"
      style={{ position: "absolute" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 0.8s linear, stroke 0.5s ease" }}
      />
    </svg>
  );
}
