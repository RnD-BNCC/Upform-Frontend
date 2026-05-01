import { useMemo } from "react";
import { motion } from "framer-motion";
import { GuessNumberChartSvg } from "@/components/icons";
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
        <GuessNumberChartSvg
          svgWidth={SVG_W}
          svgHeight={SVG_H}
          fillPath={fillPath}
          strokePath={strokePath}
          baseline={baseline}
          ticks={ticks}
          textColor={textColor}
          xForValue={xS}
          className="w-full"
          style={{ height: 220 }}
          gradientId="gnFill"
          fillTopOpacity={0.6}
          fillBottomOpacity={0.04}
          strokeWidth={3}
          animated
          showCorrectAnswer={showCorrectAnswer}
          correctNumber={correctNumber}
          lineTop={PAD_T}
        />
      </div>
    </div>
  );
}
