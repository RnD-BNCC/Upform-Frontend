import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  ArrowsOutSimpleIcon,
  CheckCircleIcon,
  DiceFiveIcon,
  KeyboardIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  HotkeysModal,
  type HotkeyGroup,
} from "@/pages/polls/present/components";
import {
  LOTTERY_BALL_COLORS,
  darkenHex,
  lightenHex,
  type LotteryParticipant,
} from "@/utils/game";
import PresenterToolbarButton from "./PresenterToolbarButton";
import { drawCanvasBall } from "../utils/drawCanvasBall";

type DrawPhase = "idle" | "shaking" | "settling";

type PhysBall = {
  color: string;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

type LotteryPresenterProps = {
  onClose: () => void;
  participants: LotteryParticipant[];
};

const LOTTERY_HOTKEY_GROUPS: HotkeyGroup[] = [
  {
    title: "Drawing",
    rows: [
      { keyLabel: "Space", description: "Draw lottery code" },
      { keyLabel: "Enter", description: "Draw lottery code" },
      { keyLabel: "K", description: "Keep selected code in pool" },
      { keyLabel: "Del", description: "Remove selected code from next draw" },
      { keyLabel: "Back", description: "Remove selected code from next draw" },
    ],
  },
  {
    title: "Presenting",
    rows: [
      { keyLabel: "R", description: "Restore removed codes" },
      { keyLabel: "F", description: "Toggle fullscreen" },
      { keyLabel: "?", description: "Show keyboard shortcuts" },
      { keyLabel: "H", description: "Show keyboard shortcuts" },
      { keyLabel: "Esc", description: "Exit / close overlay" },
    ],
  },
];

const AIR_FRICTION = 0.989;
const BALL_RADIUS = 15;
const BALL_RESTITUTION = 0.5;
const GRAVITY = 0.32;
const MAX_SPEED_IDLE = 9;
const MAX_SPEED_SHAKE = 17;
const SHAKE_FORCE = 2.6;
const WALL_RESTITUTION = 0.42;

export default function LotteryPresenter({
  onClose,
  participants,
}: LotteryPresenterProps) {
  const [winner, setWinner] = useState<LotteryParticipant | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => new Set());
  const [showHelp, setShowHelp] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const winnerRevealRef = useRef<HTMLDivElement>(null);
  const risingBallRef = useRef<HTMLDivElement>(null);
  const ballsRef = useRef<PhysBall[]>([]);
  const frameRef = useRef<number | null>(null);
  const phaseRef = useRef<DrawPhase>("idle");

  const drawPool = useMemo(
    () => participants.filter((participant) => !excludedIds.has(participant.id)),
    [excludedIds, participants],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = canvas.offsetWidth || 352;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.scale(dpr, dpr);

    const center = size / 2;
    const sphereRadius = center - 18;
    const maxDistance = sphereRadius - BALL_RADIUS - 1;
    const count = Math.min(drawPool.length, 32);

    ballsRef.current = Array.from({ length: count }, (_, index) => ({
      color: LOTTERY_BALL_COLORS[index % LOTTERY_BALL_COLORS.length],
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 0.6,
      x: (Math.random() * 2 - 1) * maxDistance * 0.78,
      y: maxDistance * 0.18 + Math.random() * maxDistance * 0.65,
    }));
    phaseRef.current = "idle";

    const loop = () => {
      const phase = phaseRef.current;
      const balls = ballsRef.current;
      const speedCap = phase === "shaking" ? MAX_SPEED_SHAKE : MAX_SPEED_IDLE;

      for (const ball of balls) {
        ball.vy += GRAVITY;

        if (phase === "shaking") {
          const angle = Math.random() * Math.PI * 2;
          const force = SHAKE_FORCE * (0.7 + Math.random() * 0.6);
          ball.vx += Math.cos(angle) * force;
          ball.vy += Math.sin(angle) * force - 1.4;
        }

        ball.vx *= AIR_FRICTION;
        ball.vy *= AIR_FRICTION;

        const speed = Math.hypot(ball.vx, ball.vy);
        if (speed > speedCap) {
          ball.vx = (ball.vx / speed) * speedCap;
          ball.vy = (ball.vy / speed) * speedCap;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;

        const distance = Math.hypot(ball.x, ball.y);
        if (distance > maxDistance && distance > 0.001) {
          const nx = ball.x / distance;
          const ny = ball.y / distance;
          const dot = ball.vx * nx + ball.vy * ny;

          if (dot > 0) {
            ball.vx -= (1 + WALL_RESTITUTION) * dot * nx;
            ball.vy -= (1 + WALL_RESTITUTION) * dot * ny;
          }

          ball.x = nx * maxDistance;
          ball.y = ny * maxDistance;
        }
      }

      for (let i = 0; i < balls.length; i += 1) {
        for (let j = i + 1; j < balls.length; j += 1) {
          const left = balls[i];
          const right = balls[j];
          const dx = right.x - left.x;
          const dy = right.y - left.y;
          const distanceSquared = dx * dx + dy * dy;
          const minDistance = BALL_RADIUS * 2;

          if (distanceSquared < minDistance * minDistance && distanceSquared > 0.0001) {
            const distance = Math.sqrt(distanceSquared);
            const nx = dx / distance;
            const ny = dy / distance;
            const overlap = (minDistance - distance) * 0.52;

            left.x -= nx * overlap;
            left.y -= ny * overlap;
            right.x += nx * overlap;
            right.y += ny * overlap;

            const dvx = right.vx - left.vx;
            const dvy = right.vy - left.vy;
            const relativeDot = dvx * nx + dvy * ny;

            if (relativeDot < 0) {
              const impulse = (-(1 + BALL_RESTITUTION) * relativeDot) / 2;
              left.vx -= impulse * nx;
              left.vy -= impulse * ny;
              right.vx += impulse * nx;
              right.vy += impulse * ny;
            }
          }
        }
      }

      context.clearRect(0, 0, size, size);
      context.save();
      context.beginPath();
      context.arc(center, center, sphereRadius, 0, Math.PI * 2);
      context.clip();

      const order = balls
        .map((_, index) => index)
        .sort((leftIndex, rightIndex) => balls[leftIndex].y - balls[rightIndex].y);

      for (const index of order) {
        const ball = balls[index];
        drawCanvasBall(
          context,
          center + ball.x,
          center + ball.y,
          BALL_RADIUS,
          ball.color,
        );
      }

      context.restore();
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [drawPool.length]);

  const resetVisuals = useCallback(() => {
    phaseRef.current = "idle";
    gsap.killTweensOf([glassRef.current, winnerRevealRef.current, risingBallRef.current]);
    gsap.set(winnerRevealRef.current, { autoAlpha: 0, clearProps: "transform" });
    gsap.set(risingBallRef.current, { autoAlpha: 0, clearProps: "transform" });
    gsap.set(glassRef.current, { clearProps: "transform" });
  }, []);

  const animateWinnerExit = useCallback(
    (nextWinner: LotteryParticipant, color: string) => {
      const rising = risingBallRef.current;
      if (!rising) {
        setWinner(nextWinner);
        setIsDrawing(false);
        return;
      }

      rising.style.background = `radial-gradient(circle at 34% 28%, #ffffff 0%, ${lightenHex(
        color,
        45,
      )} 22%, ${color} 55%, ${darkenHex(color, 35)} 100%)`;
      rising.style.boxShadow = `inset -4px -5px 12px rgba(0,0,0,0.22), inset 3px 4px 9px rgba(255,255,255,0.88), 0 6px 24px ${color}99`;

      gsap
        .timeline({
          onComplete: () => {
            setWinner(nextWinner);
            setIsDrawing(false);
          },
        })
        .fromTo(
          rising,
          { autoAlpha: 0, y: 32, scale: 0.65 },
          { autoAlpha: 1, y: 8, scale: 1, duration: 0.32, ease: "back.out(1.6)" },
        )
        .to(rising, { y: -56, duration: 0.55, ease: "power2.inOut" })
        .to(rising, {
          autoAlpha: 0,
          scale: 1.5,
          y: -76,
          duration: 0.24,
          ease: "power2.out",
        });
    },
    [],
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    void rootRef.current?.requestFullscreen();
  }, []);

  const drawWinner = useCallback(() => {
    if (drawPool.length === 0 || isDrawing) return;

    setWinner(null);
    setShowHelp(false);
    setIsDrawing(true);

    const index = Math.floor(Math.random() * drawPool.length);
    const nextWinner = drawPool[index];
    const winnerColor = LOTTERY_BALL_COLORS[index % LOTTERY_BALL_COLORS.length];
    phaseRef.current = "shaking";

    gsap
      .timeline()
      .to(glassRef.current, {
        duration: 0.09,
        ease: "power1.inOut",
        repeat: 26,
        rotation: () => gsap.utils.random(-5.5, 5.5),
        transformOrigin: "50% 100%",
        x: () => gsap.utils.random(-14, 14),
        y: () => gsap.utils.random(-7, 7),
        yoyo: true,
      })
      .to(glassRef.current, { duration: 0.3, rotation: 0, x: 0, y: 0 })
      .add(() => {
        phaseRef.current = "settling";
        window.setTimeout(() => {
          phaseRef.current = "idle";
          animateWinnerExit(nextWinner, winnerColor);
        }, 850);
      });
  }, [animateWinnerExit, drawPool, isDrawing]);

  const keepWinner = useCallback(() => {
    if (!winner || isDrawing) return;

    setWinner(null);
    resetVisuals();
  }, [isDrawing, resetVisuals, winner]);

  const removeWinner = useCallback(() => {
    if (!winner || isDrawing) return;

    setExcludedIds((current) => {
      const next = new Set(current);
      next.add(winner.id);
      return next;
    });
    setWinner(null);
    resetVisuals();
  }, [isDrawing, resetVisuals, winner]);

  const restoreRemoved = useCallback(() => {
    if (isDrawing) return;

    setExcludedIds(new Set<string>());
    setWinner(null);
    resetVisuals();
  }, [isDrawing, resetVisuals]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showHelp) {
          setShowHelp(false);
          return;
        }

        onClose();
      }

      if (event.key.toLowerCase() === "f") toggleFullscreen();
      if (event.key === "?" || event.key.toLowerCase() === "h") {
        event.preventDefault();
        setShowHelp((value) => !value);
      }
      if (event.key.toLowerCase() === "k") keepWinner();
      if (event.key.toLowerCase() === "r") restoreRemoved();
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        removeWinner();
      }
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        drawWinner();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    drawWinner,
    keepWinner,
    onClose,
    removeWinner,
    restoreRemoved,
    showHelp,
    toggleFullscreen,
  ]);

  useEffect(() => {
    setExcludedIds((current) => {
      const validIds = new Set(participants.map((participant) => participant.id));
      const next = new Set([...current].filter((id) => validIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [participants]);

  useEffect(() => {
    if (!winner) return;

    gsap.fromTo(
      winnerRevealRef.current,
      { autoAlpha: 0, rotation: -6, scale: 0.28, y: 80 },
      {
        autoAlpha: 1,
        duration: 0.85,
        ease: "back.out(2.2)",
        rotation: 0,
        scale: 1,
        y: 0,
      },
    );
  }, [winner]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[1100] overflow-hidden bg-[#020408] text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(28,56,115,0.62)_0%,rgba(7,11,22,0.98)_52%,#020408_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.84))]" />
      <div className="absolute inset-x-0 bottom-0 h-[24rem] bg-[radial-gradient(ellipse_65%_42%_at_50%_100%,rgba(210,160,65,0.2),transparent_62%)]" />

      <main className="relative z-10 flex h-full items-center justify-center pb-20 pt-8">
        <div className="relative flex h-full max-h-[54rem] min-h-[34rem] w-full max-w-4xl items-center justify-center">
          <div className="absolute bottom-5 h-12 w-[20rem] max-w-[60vw] rounded-[50%] bg-black/80 blur-2xl" />

          <div ref={glassRef} className="relative flex origin-bottom flex-col items-center">
            <div
              ref={risingBallRef}
              className="pointer-events-none absolute left-1/2 z-[65] rounded-full opacity-0"
              style={{
                border: "1.5px solid rgba(255,255,255,0.68)",
                height: "2rem",
                top: "0.6rem",
                transform: "translateX(-50%)",
                width: "2rem",
              }}
            />

            <div className="relative z-[60] flex flex-col items-center">
              <div className="h-8 w-12 rounded-t-full border-x border-t border-white/32 bg-[linear-gradient(180deg,rgba(205,222,242,0.18),rgba(14,26,50,0.55))] shadow-[inset_0_2px_7px_rgba(255,255,255,0.14),inset_0_-4px_8px_rgba(0,0,0,0.45)]" />
              <div
                className="h-2.5 rounded-full border border-white/42 bg-[linear-gradient(180deg,rgba(255,255,255,0.30),rgba(155,182,215,0.1))] shadow-[0_3px_10px_rgba(0,0,0,0.48)]"
                style={{ width: "4.5rem" }}
              />
            </div>

            <div
              className="relative -mt-0.5 overflow-hidden rounded-full border border-white/22 shadow-[inset_0_0_70px_rgba(14,32,72,0.55),inset_0_-70px_100px_rgba(4,11,26,0.62),0_50px_130px_rgba(0,0,0,0.78),0_0_90px_rgba(55,105,195,0.08)]"
              style={{
                height: "22rem",
                maxHeight: "70vw",
                maxWidth: "70vw",
                width: "22rem",
              }}
            >
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_52%_46%,rgba(115,162,218,0.05),rgba(32,62,115,0.12)_55%,rgba(7,13,28,0.4)_100%)]" />
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(136deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.06)_22%,transparent_48%,rgba(255,255,255,0.04)_76%,rgba(255,255,255,0.18)_100%)]" />
              <div className="pointer-events-none absolute left-[8%] top-[5%] h-[36%] w-[44%] rounded-full bg-white/22 blur-sm" />
              <div className="pointer-events-none absolute left-[16%] top-[7%] h-[17%] w-[30%] rounded-full bg-white/52 blur-[3px]" />
              <div className="pointer-events-none absolute left-[22%] top-[9%] h-[5%] w-[8%] rounded-full bg-white/82" />
              <div className="pointer-events-none absolute right-[3%] top-[18%] h-[54%] w-[10%] rounded-full bg-white/14 blur-md" />
              <div className="pointer-events-none absolute bottom-[8%] right-[7%] h-[22%] w-[8%] rounded-full bg-white/14 blur-[3px]" />
              <div className="pointer-events-none absolute left-[20%] top-[11%] h-1 w-[30%] rounded-full bg-white/24 blur-[1px]" />
              <div className="pointer-events-none absolute left-[30%] top-[15%] h-px w-[20%] rounded-full bg-white/16" />
              <div className="pointer-events-none absolute left-[38%] top-[19%] h-px w-[14%] rounded-full bg-white/12" />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[35%] rounded-b-full bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.18))]" />
              <div className="pointer-events-none absolute bottom-[6%] left-1/2 h-[18%] w-[60%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.16),rgba(130,190,225,0.08)_52%,transparent_72%)]" />
              <div className="pointer-events-none absolute inset-px rounded-full ring-1 ring-inset ring-white/10" />
            </div>

            <div
              className="-mt-1 h-3.5 rounded-full border border-white/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(165,192,220,0.08))] shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_3px_rgba(255,255,255,0.2)]"
              style={{ maxWidth: "72vw", width: "22.8rem" }}
            />
            <div className="relative -mt-0.5 h-9 w-20 border-x border-white/16 bg-[linear-gradient(90deg,rgba(255,255,255,0.12),rgba(215,232,250,0.06)_40%,rgba(175,198,225,0.12))]">
              <div className="absolute left-2.5 top-1 h-7 w-2.5 rounded-full bg-white/16" />
              <div className="absolute right-3 top-2 h-5 w-1.5 rounded-full bg-white/10" />
            </div>

            <div className="flex flex-col items-center">
              <div className="h-3 w-36 rounded-full border border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(125,152,185,0.07))] shadow-[0_4px_10px_rgba(0,0,0,0.52)]" />
              <div className="h-5 w-32 border-x border-b border-white/12 bg-[linear-gradient(180deg,rgba(155,178,205,0.1),rgba(85,112,142,0.05))]" />
              <div className="h-2 w-44 rounded-b-sm border border-white/18 bg-[linear-gradient(180deg,rgba(190,212,235,0.11),rgba(115,142,172,0.04))] shadow-[0_8px_24px_rgba(0,0,0,0.58)]" />
              <div
                className="mt-1 h-1.5 w-36 rounded-full blur-sm"
                style={{ background: "rgba(205,172,105,0.13)" }}
              />
            </div>
          </div>

          <div
            ref={winnerRevealRef}
            aria-live="polite"
            className="pointer-events-none absolute left-1/2 top-4 z-[70] flex items-center justify-center rounded-full border-2 border-white/88 p-4 text-center opacity-0 shadow-[inset_-22px_-28px_44px_rgba(10,22,46,0.26),inset_15px_15px_30px_rgba(255,255,255,0.97),0_34px_96px_rgba(218,172,72,0.34),0_0_60px_rgba(255,255,255,0.07)]"
            style={{
              background:
                "radial-gradient(circle at 31% 26%, #ffffff 0%, #f4f8ff 28%, #c4d6ee 64%, #86a6c8 100%)",
              height: "13rem",
              maxHeight: "40vw",
              maxWidth: "40vw",
              transform: "translateX(-50%)",
              width: "13rem",
            }}
          >
            {winner ? (
              <div className="relative z-10 flex flex-col items-center">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500/78">
                  Lottery Code
                </p>
                <p className="mt-2 break-all font-mono text-3xl font-black leading-none text-slate-950">
                  {winner.number}
                </p>
              </div>
            ) : null}
            <span className="absolute left-7 top-5 h-11 w-14 rounded-full bg-white/84 blur-[3px]" />
            <span className="absolute bottom-8 right-8 h-9 w-9 rounded-full bg-rose-400/60" />
          </div>
        </div>
      </main>

      <div className="group fixed bottom-0 left-0 right-0 z-20 flex h-24 items-end justify-center pb-5">
        <div className="flex translate-y-4 items-center justify-between gap-4 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 opacity-0 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex items-center gap-1">
            <PresenterToolbarButton
              onClick={drawWinner}
              disabled={isDrawing || drawPool.length === 0}
              title="Draw code (Space / Enter)"
            >
              <DiceFiveIcon size={18} weight="fill" />
            </PresenterToolbarButton>
            <PresenterToolbarButton
              onClick={keepWinner}
              disabled={!winner || isDrawing}
              title="Keep selected code in the pool (K)"
            >
              <CheckCircleIcon size={18} weight="bold" />
            </PresenterToolbarButton>
            <PresenterToolbarButton
              onClick={removeWinner}
              disabled={!winner || isDrawing}
              title="Remove selected code from the next draw (Delete)"
            >
              <TrashIcon size={18} weight="bold" />
            </PresenterToolbarButton>
          </div>
          <div className="flex items-center gap-1">
            <PresenterToolbarButton onClick={toggleFullscreen} title="Fullscreen (F)">
              <ArrowsOutSimpleIcon size={18} weight="bold" />
            </PresenterToolbarButton>
            <PresenterToolbarButton
              active={showHelp}
              onClick={() => setShowHelp(true)}
              title="Keyboard shortcuts (?)"
            >
              <KeyboardIcon size={18} weight="bold" />
            </PresenterToolbarButton>
          </div>
          <div className="flex items-center gap-1">
            <PresenterToolbarButton onClick={onClose} title="Exit (Esc)" variant="danger">
              <XIcon size={18} weight="bold" />
            </PresenterToolbarButton>
          </div>
        </div>
      </div>

      <HotkeysModal
        groups={LOTTERY_HOTKEY_GROUPS}
        open={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
}
