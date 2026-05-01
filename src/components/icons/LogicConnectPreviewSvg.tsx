type Props = {
  d: string;
  curX: number;
  curY: number;
  hasTarget: boolean;
};

export default function LogicConnectPreviewSvg({
  d,
  curX,
  curY,
  hasTarget,
}: Props) {
  return (
    <svg
      className="pointer-events-none"
      style={{
        position: "absolute",
        left: -5000,
        top: -5000,
        width: 20000,
        height: 20000,
      }}
    >
      <g transform="translate(5000, 5000)">
        <path
          d={d}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        {!hasTarget ? <circle cx={curX} cy={curY} r="4" fill="#94a3b8" /> : null}
      </g>
    </svg>
  );
}
