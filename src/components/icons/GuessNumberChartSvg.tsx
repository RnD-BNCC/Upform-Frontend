import type { CSSProperties } from "react";
import { motion } from "framer-motion";

type Props = {
  svgWidth: number;
  svgHeight: number;
  fillPath: string;
  strokePath: string;
  baseline: number;
  ticks: number[];
  textColor: string;
  xForValue: (value: number) => number;
  className?: string;
  style?: CSSProperties;
  gradientId: string;
  fillTopOpacity?: number;
  fillBottomOpacity?: number;
  strokeWidth?: number;
  animated?: boolean;
  showCorrectAnswer?: boolean;
  correctNumber?: number;
  lineTop?: number;
  axisStrokeOpacity?: number;
  axisStrokeWidth?: number;
  tickLineLength?: number;
  tickStrokeWidth?: number;
  tickFontSize?: number;
  tickLabelOffset?: number;
  tickFillOpacity?: number;
  correctLineStroke?: string;
  correctLineStrokeWidth?: number;
  correctLineStrokeDasharray?: string;
};

export default function GuessNumberChartSvg({
  svgWidth,
  svgHeight,
  fillPath,
  strokePath,
  baseline,
  ticks,
  textColor,
  xForValue,
  className,
  style,
  gradientId,
  fillTopOpacity = 0.6,
  fillBottomOpacity = 0.04,
  strokeWidth = 3,
  animated = false,
  showCorrectAnswer = false,
  correctNumber,
  lineTop = 0,
  axisStrokeOpacity = 0.15,
  axisStrokeWidth = 1.5,
  tickLineLength = 4,
  tickStrokeWidth = 1.5,
  tickFontSize = 11,
  tickLabelOffset = 16,
  tickFillOpacity = 0.5,
  correctLineStroke = "#10b981",
  correctLineStrokeWidth,
  correctLineStrokeDasharray,
}: Props) {
  const resolvedCorrectLineStrokeWidth =
    correctLineStrokeWidth ?? (animated ? 3 : 2.5);

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity={fillTopOpacity} />
          <stop
            offset="100%"
            stopColor="#818cf8"
            stopOpacity={fillBottomOpacity}
          />
        </linearGradient>
      </defs>

      {animated ? (
        <>
          <motion.path
            d={fillPath}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: showCorrectAnswer ? 0.3 : 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.path
            d={strokePath}
            stroke="#6366f1"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: showCorrectAnswer ? 0.3 : 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </>
      ) : (
        <>
          <path d={fillPath} fill={`url(#${gradientId})`} />
          <path
            d={strokePath}
            stroke="#6366f1"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      {showCorrectAnswer && correctNumber !== undefined
        ? animated
          ? (
            <motion.line
              x1={xForValue(correctNumber)}
              y1={lineTop}
              x2={xForValue(correctNumber)}
              y2={baseline}
              stroke={correctLineStroke}
              strokeWidth={resolvedCorrectLineStrokeWidth}
              strokeDasharray={correctLineStrokeDasharray}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            />
          )
          : (
            <line
              x1={xForValue(correctNumber)}
              y1={lineTop}
              x2={xForValue(correctNumber)}
              y2={baseline}
              stroke={correctLineStroke}
              strokeWidth={resolvedCorrectLineStrokeWidth}
              strokeDasharray={correctLineStrokeDasharray}
            />
          )
        : null}

      <line
        x1={xForValue(ticks[0] ?? 0)}
        y1={baseline}
        x2={xForValue(ticks[ticks.length - 1] ?? 0)}
        y2={baseline}
        stroke={textColor}
        strokeOpacity={axisStrokeOpacity}
        strokeWidth={axisStrokeWidth}
      />

      {ticks.map((value) => (
        <g key={value} transform={`translate(${xForValue(value)}, ${baseline})`}>
          <line
            y1={0}
            y2={tickLineLength}
            stroke={textColor}
            strokeOpacity={0.25}
            strokeWidth={tickStrokeWidth}
          />
          <text
            y={tickLabelOffset}
            textAnchor="middle"
            fontSize={tickFontSize}
            fill={textColor}
            fillOpacity={tickFillOpacity}
            fontWeight="600"
          >
            {value}
          </text>
        </g>
      ))}
    </svg>
  );
}
