import { useMemo } from "react";
import { motion } from "framer-motion";
import type { GuessNumberResult, SlideSettings } from "@/types/polling";

const SVG_W = 600;
const SVG_H = 200;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 48;
const PAD_B = 24;

function smoothDistribution(
  distribution: { value: number; count: number }[],
  min: number,
  max: number,
  points = 200,
): { x: number; y: number }[] {
  if (distribution.length === 0) return [];
  const range = max - min || 1;
  const bandwidth = Math.max(range * 0.06, 0.3);
  const result: { x: number; y: number }[] = [];
  for (let i = 0; i < points; i++) {
    const x = min + (i / (points - 1)) * range;
    let y = 0;
    for (const d of distribution) {
      const diff = (x - d.value) / bandwidth;
      y += d.count * Math.exp(-0.5 * diff * diff);
    }
    result.push({ x, y });
  }
  const maxY = Math.max(...result.map((p) => p.y), 0.001);
  return result.map((p) => ({ x: p.x, y: p.y / maxY }));
}

function buildFillPath(
  points: { x: number; y: number }[],
  min: number,
  max: number,
): string {
  if (points.length === 0) return "";
  const range = max - min || 1;
  const drawW = SVG_W - PAD_L - PAD_R;
  const drawH = SVG_H - PAD_T - PAD_B;
  const xS = (v: number) => PAD_L + ((v - min) / range) * drawW;
  const yS = (v: number) => PAD_T + drawH - v * drawH * 0.9;

  let d = `M ${xS(points[0].x)} ${yS(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (xS(prev.x) + xS(curr.x)) / 2;
    d += ` C ${cpx} ${yS(prev.y)}, ${cpx} ${yS(curr.y)}, ${xS(curr.x)} ${yS(curr.y)}`;
  }
  const bl = PAD_T + drawH;
  d += ` L ${xS(points[points.length - 1].x)} ${bl} L ${xS(points[0].x)} ${bl} Z`;
  return d;
}

function buildStrokePath(
  points: { x: number; y: number }[],
  min: number,
  max: number,
): string {
  if (points.length === 0) return "";
  const range = max - min || 1;
  const drawW = SVG_W - PAD_L - PAD_R;
  const drawH = SVG_H - PAD_T - PAD_B;
  const xS = (v: number) => PAD_L + ((v - min) / range) * drawW;
  const yS = (v: number) => PAD_T + drawH - v * drawH * 0.9;

  let d = `M ${xS(points[0].x)} ${yS(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (xS(prev.x) + xS(curr.x)) / 2;
    d += ` C ${cpx} ${yS(prev.y)}, ${cpx} ${yS(curr.y)}, ${xS(curr.x)} ${yS(curr.y)}`;
  }
  return d;
}

export default function GuessNumberViz({
  data,
  textColor = "#111827",
  correctNumber,
  settings,
  showCorrectAnswer = false,
}: {
  data: GuessNumberResult;
  textColor?: string;
  correctNumber?: number;
  settings?: SlideSettings;
  showCorrectAnswer?: boolean;
}) {
  const min = settings?.numberMin ?? 0;
  const max = settings?.numberMax ?? 10;

  const smoothed = useMemo(
    () => smoothDistribution(data ?? [], min, max),
    [data, min, max],
  );
  const fillPath = useMemo(
    () => buildFillPath(smoothed, min, max),
    [smoothed, min, max],
  );
  const strokePath = useMemo(
    () => buildStrokePath(smoothed, min, max),
    [smoothed, min, max],
  );

  const total = useMemo(
    () => (data ?? []).reduce((s, d) => s + d.count, 0),
    [data],
  );
  const mean = useMemo(
    () =>
      total > 0
        ? (data ?? []).reduce((s, d) => s + d.value * d.count, 0) / total
        : null,
    [data, total],
  );

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full text-lg"
        style={{ color: textColor, opacity: 0.4 }}
      >
        Waiting for guesses...
      </div>
    );
  }

  const range = max - min || 1;
  const drawW = SVG_W - PAD_L - PAD_R;
  const drawH = SVG_H - PAD_T - PAD_B;
  const xS = (v: number) => PAD_L + ((v - min) / range) * drawW;
  const baseline = PAD_T + drawH;

  const tickStep = range <= 10 ? 1 : range <= 20 ? 2 : Math.ceil(range / 10);
  const ticks: number[] = [];
  for (let v = min; v <= max; v += tickStep) ticks.push(v);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto px-4 py-6">
      {/* Stats row */}
      <div className="flex items-center gap-10">
        <div className="text-center">
          <span
            className="text-4xl font-black tabular-nums"
            style={{ color: textColor }}
          >
            {mean !== null ? mean.toFixed(1) : "—"}
          </span>
          <p
            className="text-xs font-semibold mt-0.5"
            style={{ color: textColor, opacity: 0.45 }}
          >
            Average
          </p>
        </div>
        <div className="text-center">
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: textColor, opacity: 0.6 }}
          >
            {total}
          </span>
          <p
            className="text-xs font-semibold mt-0.5"
            style={{ color: textColor, opacity: 0.45 }}
          >
            Guesses
          </p>
        </div>
        {showCorrectAnswer && correctNumber !== undefined && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.35 }}
          >
            <span className="text-4xl font-black tabular-nums text-emerald-500">
              {correctNumber}
            </span>
            <p className="text-xs font-semibold mt-0.5 text-emerald-500 opacity-70">
              Correct
            </p>
          </motion.div>
        )}
      </div>

      {/* Distribution chart */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ height: 220 }}
        >
          <defs>
            <linearGradient id="gnFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Filled area */}
          <motion.path
            d={fillPath}
            fill="url(#gnFill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: showCorrectAnswer ? 0.3 : 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Stroke */}
          <motion.path
            d={strokePath}
            stroke="#6366f1"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: showCorrectAnswer ? 0.3 : 1,
            }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />

          {/* Correct answer indicator */}
          {showCorrectAnswer && correctNumber !== undefined && (
            <motion.line
              x1={xS(correctNumber)}
              y1={PAD_T}
              x2={xS(correctNumber)}
              y2={baseline}
              stroke="#10b981"
              strokeWidth={3}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            />
          )}

          {/* X axis */}
          <line
            x1={PAD_L}
            y1={baseline}
            x2={SVG_W - PAD_R}
            y2={baseline}
            stroke={textColor}
            strokeOpacity={0.15}
            strokeWidth={1.5}
          />

          {/* Ticks */}
          {ticks.map((v) => (
            <g key={v} transform={`translate(${xS(v)}, ${baseline})`}>
              <line
                y1={0}
                y2={4}
                stroke={textColor}
                strokeOpacity={0.25}
                strokeWidth={1.5}
              />
              <text
                y={16}
                textAnchor="middle"
                fontSize={11}
                fill={textColor}
                fillOpacity={0.5}
                fontWeight="600"
              >
                {v}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
