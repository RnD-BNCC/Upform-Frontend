import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type {
  SlideType,
  SlideSettings,
  ImageLayout,
  ScaleStatementResult,
} from "@/types/polling";
import { TOOLBAR_COLORS, FORMAT_CMDS, BAR_COLORS_HEX } from "@/config/polling";
import CaretIcon from "@/components/ui/CaretIcon";
import ColorPickerDropdown from "@/components/ui/ColorPickerDropdown";
import ScaleViz from "@/components/polling/visualizations/ScaleViz";
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  ThumbsUp,
  ArrowDown,
} from "@phosphor-icons/react";

export default function SlidePreview({
  code,
  question,
  options,
  type,
  settings,
  onQuestionChange,
  onQuestionBlur,
}: {
  code: string;
  question: string;
  options: string[];
  type: SlideType;
  settings: SlideSettings;
  onQuestionChange: (val: string) => void;
  onQuestionBlur: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  const currentHtmlRef = useRef(question);
  const onChangeRef = useRef(onQuestionChange);
  const onBlurRef = useRef(onQuestionBlur);
  onChangeRef.current = onQuestionChange;
  onBlurRef.current = onQuestionBlur;

  useEffect(() => {
    if (!editing && editorRef.current) {
      editorRef.current.innerHTML = question;
      currentHtmlRef.current = question;
    }
  }, [question, editing]);

  useEffect(() => {
    if (!editing || !editorRef.current) return;
    if (counterRef.current) {
      counterRef.current.textContent = String(
        editorRef.current.innerText.length,
      );
    }
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.selectAllChildren(editorRef.current);
      sel.collapseToEnd();
    }
  }, [editing]);

  const syncFormatButtons = useCallback(() => {
    if (!containerRef.current) return;
    FORMAT_CMDS.forEach((cmd) => {
      const el = containerRef.current!.querySelector(
        `[data-cmd="${cmd}"]`,
      ) as HTMLElement | null;
      if (!el) return;
      const active = document.queryCommandState(cmd);
      if (active) {
        el.classList.add("bg-primary-100", "text-primary-600");
        el.classList.remove("text-gray-500");
      } else {
        el.classList.remove("bg-primary-100", "text-primary-600");
        el.classList.add("text-gray-500");
      }
    });
  }, []);

  useEffect(() => {
    if (!editing) return;
    const handler = () => syncFormatButtons();
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [editing, syncFormatButtons]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    currentHtmlRef.current = editorRef.current.innerHTML;
    if (counterRef.current) {
      counterRef.current.textContent = String(
        editorRef.current.innerText.length,
      );
    }
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (
      containerRef.current &&
      containerRef.current.contains(e.relatedTarget as Node)
    )
      return;
    const html = currentHtmlRef.current;
    setEditing(false);
    onChangeRef.current(html);
    onBlurRef.current(html);
  }, []);

  const execCmd = useCallback(
    (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      handleInput();
      syncFormatButtons();
    },
    [handleInput, syncFormatButtons],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            execCmd("bold");
            break;
          case "i":
            e.preventDefault();
            execCmd("italic");
            break;
          case "u":
            e.preventDefault();
            execCmd("underline");
            break;
        }
      }
    },
    [execCmd],
  );

  const joinUrl = `${window.location.origin}/live`;
  const imageUrl = settings.imageUrl;
  const imageLayout: ImageLayout = settings.imageLayout ?? "above";
  const showInstructions = settings.showInstructionsBar !== false;

  const questionEditor = (
    <div className="mb-4" ref={containerRef}>
      <div
        className="rounded-lg cursor-text transition-shadow px-4 py-3 relative"
        style={{ boxShadow: editing ? "0 0 0 2px #818cf8" : undefined }}
        onMouseEnter={(e) => {
          if (!editing) e.currentTarget.style.boxShadow = "0 0 0 2px #818cf8";
        }}
        onMouseLeave={(e) => {
          if (!editing) e.currentTarget.style.boxShadow = "none";
        }}
        onClick={() => {
          if (!editing) setEditing(true);
        }}
      >
        <div
          ref={editorRef}
          contentEditable={editing ? true : undefined}
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full text-xl font-bold bg-transparent outline-none min-h-12 text-center empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 empty:before:italic empty:before:font-medium"
          data-placeholder="Type your question here..."
          style={{ color: settings.textColor ?? "#111827" }}
        />
        {editing && (
          <span
            ref={counterRef}
            className="absolute top-2 right-2 text-[10px] font-semibold text-white bg-primary-400 rounded-full w-7 h-5 flex items-center justify-center"
          >
            0
          </span>
        )}
      </div>
      {editing && (
        <div
          className="flex items-center gap-0.5 px-1 pt-2"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("removeFormat");
            }}
            className="text-[11px] text-gray-500 font-medium px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-1 cursor-pointer"
          >
            Default <CaretIcon />
          </button>
          <ColorPickerDropdown
            value="#111827"
            onChange={(c) => execCmd("foreColor", c)}
            colors={TOOLBAR_COLORS}
            direction="down"
            align="left"
            showCaret={false}
            swatchSize="sm"
            useMouseDown
            triggerClassName="w-5 h-5 rounded-full bg-gray-800 ml-1 cursor-pointer border-2 border-gray-200 hover:scale-110 transition-transform"
          />
          <div className="w-px h-4 bg-gray-200 mx-1.5" />
          {[
            {
              icon: <TextB size={15} weight="bold" />,
              title: "Bold",
              cmd: "bold",
            },
            { icon: <TextItalic size={15} />, title: "Italic", cmd: "italic" },
            {
              icon: <TextUnderline size={15} />,
              title: "Underline",
              cmd: "underline",
            },
            {
              icon: <TextStrikethrough size={15} />,
              title: "Strikethrough",
              cmd: "strikethrough",
            },
          ].map((btn) => (
            <button
              key={btn.title}
              title={btn.title}
              data-cmd={btn.cmd}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd(btn.cmd);
              }}
              className="p-1.5 rounded cursor-pointer transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              {btn.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const vizArea = (
    <>
      {type === "multiple_choice" && options.length > 0 && (
        <div className="flex items-end justify-center gap-2 mt-auto px-2 pb-1">
          {options.map((opt, i) => {
            const fakeCounts = [3, 5, 2, 4, 1, 3, 2, 4];
            const fakeCount = fakeCounts[i % fakeCounts.length];
            const maxFake = Math.max(...fakeCounts);
            const barHeight = (fakeCount / maxFake) * 100;

            return (
              <div
                key={i}
                className="flex flex-col items-center flex-1 min-w-0"
              >
                <div className="w-full relative" style={{ height: "100px" }}>
                  <span
                    className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold tabular-nums"
                    style={{
                      color: settings.textColor ?? "#111827",
                      opacity: 0.5,
                      bottom: `calc(${barHeight}% + 2px)`,
                    }}
                  >
                    {fakeCount}
                  </span>
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-md"
                    style={{
                      width: "60%",
                      height: `${barHeight}%`,
                      minHeight: "3px",
                      opacity: 0.7,
                      backgroundColor:
                        settings.barColors?.[i] ||
                        BAR_COLORS_HEX[i % BAR_COLORS_HEX.length],
                    }}
                  />
                </div>
                <span
                  className="text-[8px] font-medium mt-1 truncate w-full text-center"
                  style={{
                    color: settings.textColor ?? "#111827",
                    opacity: 0.6,
                  }}
                >
                  {opt || `Option ${i + 1}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {type === "multiple_choice" && options.length === 0 && (
        <div
          className="flex-1 flex items-center justify-center text-sm"
          style={{ color: settings.textColor ?? "#111827", opacity: 0.3 }}
        >
          Add options to preview
        </div>
      )}
      {type === "word_cloud" && (
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
          Word cloud responses will appear here
        </div>
      )}

      {type === "scales" && options.length > 0 && (
        <ScaleViz
          data={options.map((stmt, i) => {
            const min = (settings.scaleMin as number) ?? 1;
            const max = (settings.scaleMax as number) ?? 10;
            const range = max - min || 1;
            const patterns = [
              [0.55, 0.65, 0.7, 0.75, 0.8],
              [0.25, 0.35, 0.4, 0.45, 0.35],
              [0.6, 0.65, 0.7, 0.65, 0.75],
              [0.3, 0.35, 0.5, 0.55, 0.45],
              [0.7, 0.75, 0.8, 0.85, 0.9],
            ];
            const ratios = patterns[i % patterns.length];
            const values = ratios.map((r) => Math.round(min + range * r));
            const distMap = new Map<number, number>();
            for (const v of values) distMap.set(v, (distMap.get(v) ?? 0) + 1);
            const distribution = Array.from(distMap.entries())
              .map(([value, count]) => ({ value, count }))
              .sort((a, b) => a.value - b.value);
            const total = values.length;
            const avg = values.reduce((s, v) => s + v, 0) / total;
            return {
              statement: stmt || `Statement ${i + 1}`,
              distribution,
              average: avg,
              responseCount: total,
            };
          })}
          textColor={settings.textColor ?? "#111827"}
          settings={settings}
        />
      )}
      {type === "scales" && options.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
          Add statements to preview
        </div>
      )}
      {type === "qa" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <p className="text-[9px] font-semibold text-gray-400 tabular-nums">
            0/0 answered
          </p>
          <p
            className="text-sm font-bold text-center leading-snug"
            style={{ color: settings.textColor ?? "#111827" }}
          >
            Sample question from audience
          </p>
          <div
            className="flex items-center gap-1"
            style={{ color: settings.textColor ?? "#111827", opacity: 0.35 }}
          >
            <ThumbsUp size={10} weight="fill" />
            <span className="text-[9px] font-medium">0</span>
          </div>
          <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center mt-2">
            <ArrowDown size={8} weight="bold" className="text-gray-400" />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-gray-800 text-white">
              ENTER
            </span>
            <span className="text-[7px] text-gray-400">
              to mark as answered
            </span>
          </div>
        </div>
      )}
      {type === "guess_number" &&
        (() => {
          const gnMin = settings.numberMin ?? 0;
          const gnMax = settings.numberMax ?? 10;
          const gnRange = gnMax - gnMin || 1;
          const W = 400,
            H = 80,
            PL = 4,
            PR = 4,
            PT = 12,
            PB = 16;
          const drawW = W - PL - PR;
          const drawH = H - PT - PB;
          const xS = (v: number) => PL + ((v - gnMin) / gnRange) * drawW;
          const yS = (v: number) => PT + drawH - v * drawH * 0.88;
          const baseline = PT + drawH;
          const bw = Math.max(gnRange * 0.06, 0.3);
          const fakeDist = [
            { value: gnMin + gnRange * 0.25, count: 2 },
            { value: gnMin + gnRange * 0.45, count: 5 },
            { value: gnMin + gnRange * 0.6, count: 4 },
            { value: gnMin + gnRange * 0.78, count: 2 },
          ];
          const rawPts: { x: number; y: number }[] = [];
          for (let i = 0; i < 100; i++) {
            const x = gnMin + (i / 99) * gnRange;
            let y = 0;
            for (const d of fakeDist) {
              const diff = (x - d.value) / bw;
              y += d.count * Math.exp(-0.5 * diff * diff);
            }
            rawPts.push({ x, y });
          }
          const maxY = Math.max(...rawPts.map((p) => p.y), 0.001);
          const pts = rawPts.map((p) => ({ x: p.x, y: p.y / maxY }));
          let fill = `M ${xS(pts[0].x)} ${yS(pts[0].y)}`;
          let stroke = `M ${xS(pts[0].x)} ${yS(pts[0].y)}`;
          for (let i = 1; i < pts.length; i++) {
            const prev = pts[i - 1],
              curr = pts[i];
            const cpx = (xS(prev.x) + xS(curr.x)) / 2;
            const seg = ` C ${cpx} ${yS(prev.y)}, ${cpx} ${yS(curr.y)}, ${xS(curr.x)} ${yS(curr.y)}`;
            fill += seg;
            stroke += seg;
          }
          fill += ` L ${xS(pts[pts.length - 1].x)} ${baseline} L ${xS(pts[0].x)} ${baseline} Z`;
          const tc = settings.textColor ?? "#111827";
          const cn = settings.correctNumber;
          const tickStep = gnRange <= 10 ? 1 : gnRange <= 20 ? 2 : Math.ceil(gnRange / 10);
          const ticks: number[] = [];
          for (let v = gnMin; v <= gnMax; v += tickStep) ticks.push(v);
          if (ticks[ticks.length - 1] !== gnMax) ticks.push(gnMax);
          return (
            <div className="flex-1 flex flex-col justify-end px-3 pb-1">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="w-full"
                style={{ height: 80 }}
              >
                <defs>
                  <linearGradient id="gnPreviewFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.03" />
                  </linearGradient>
                </defs>
                <path d={fill} fill="url(#gnPreviewFill)" />
                <path d={stroke} stroke="#6366f1" strokeWidth={2} fill="none" strokeLinecap="round" />
                {cn !== undefined && (
                  <line x1={xS(cn)} y1={PT - 4} x2={xS(cn)} y2={baseline} stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 2" />
                )}
                <line x1={PL} y1={baseline} x2={W - PR} y2={baseline} stroke={tc} strokeOpacity={0.12} strokeWidth={1} />
                {ticks.map((v) => (
                  <g key={v} transform={`translate(${xS(v)}, ${baseline})`}>
                    <line y1={0} y2={3} stroke={tc} strokeOpacity={0.25} strokeWidth={1} />
                    <text y={11} textAnchor="middle" fontSize={8} fill={tc} fillOpacity={0.45} fontWeight="600">{v}</text>
                  </g>
                ))}
              </svg>
            </div>
          );
        })()}
      {type === "pin_on_image" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          {settings.imageUrl ? (
            <div className="relative w-full max-h-40 overflow-hidden rounded-lg">
              <img
                src={settings.imageUrl}
                alt=""
                className="w-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/80 rounded-lg px-2 py-1 text-[10px] text-gray-500 font-medium">
                  Audience will pin here
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-300 text-sm text-center">
              Upload an image above
              <br />
              to enable pinning
            </div>
          )}
        </div>
      )}
    </>
  );

  const imageEl = imageUrl ? (
    <img
      src={imageUrl}
      alt=""
      className="w-full h-full object-contain rounded-lg"
    />
  ) : null;

  return (
    <div className="border-2 border-dashed border-primary-300 rounded-2xl p-3 bg-gray-50/50">
      <div
        className="bg-white rounded-xl shadow-sm relative"
        style={{ backgroundColor: settings.bgColor }}
      >
        <div className="absolute top-2.5 right-3 z-10">
          <span className="text-[10px] font-bold italic text-primary-500">
            UpForm
          </span>
        </div>

        {showInstructions && (
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="flex items-center gap-1 text-gray-500 text-[9px] font-medium bg-gray-100 rounded-full px-3 py-1">
              <span>
                Join at{" "}
                <span className="font-semibold text-gray-700">{joinUrl}</span>
              </span>
              <span className="text-gray-300">|</span>
              <span>use code</span>
              <span className="text-gray-900 font-bold tracking-wider text-[10px]">
                {code}
              </span>
            </div>
          </div>
        )}

        <div className="px-6 py-5 min-h-72 flex flex-col">
          {imageUrl && imageLayout === "full" && (
            <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-cover opacity-30"
              />
            </div>
          )}

          <div className="relative z-1 flex flex-col flex-1">
            {imageUrl && imageLayout === "above" && (
              <div className="flex justify-center mb-4">
                <div className="max-h-40 max-w-full overflow-hidden rounded-lg">
                  {imageEl}
                </div>
              </div>
            )}

            {imageUrl &&
            ["left", "right", "left-large", "right-large"].includes(
              imageLayout,
            ) ? (
              <div
                className={`flex gap-4 flex-1 ${imageLayout === "right" || imageLayout === "right-large" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`${imageLayout.includes("large") ? "w-3/5" : "w-2/5"} shrink-0 flex items-start`}
                >
                  <div className="w-full max-h-52 overflow-hidden rounded-lg">
                    {imageEl}
                  </div>
                </div>
                <div className="flex-1 flex flex-col">
                  {questionEditor}
                  {vizArea}
                </div>
              </div>
            ) : (
              <>
                {questionEditor}
                {vizArea}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-2 border-t border-gray-100">
          {imageUrl && (
            <span className="text-[10px] font-medium text-gray-400">
              The slide image appears in your audience's devices
            </span>
          )}
          <div className="flex items-center gap-1.5 text-gray-400 ml-auto">
            <span className="text-[10px] font-medium">
              QR code visible while presenting
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
