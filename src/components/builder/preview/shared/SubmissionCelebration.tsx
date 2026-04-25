import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { gsap } from "gsap";

type Props = {
  celebrationKey: number;
  children: ReactNode;
  className?: string;
};

const CONFETTI_COLORS = [
  "#60a5fa",
  "#34d399",
  "#f472b6",
  "#fbbf24",
  "#a78bfa",
  "#fb923c",
  "#22d3ee",
  "#a3e635",
];

type ConfettiParticle = {
  color: string;
  gravity: number;
  height: number;
  life: number;
  maxLife: number;
  opacity: number;
  rotation: number;
  rotationVelocity: number;
  shape: "circle" | "rect" | "streamer";
  size: number;
  velocityX: number;
  velocityY: number;
  width: number;
  wobble: number;
  wobbleAmplitude: number;
  wobbleVelocity: number;
  x: number;
  y: number;
};

type BurstConfig = {
  count: number;
  delay: number;
  gravity: number;
  originX: number;
  originY: number;
  speedMax: number;
  speedMin: number;
  spread: number;
};

const CONFETTI_BURSTS: BurstConfig[] = [
  {
    count: 90,
    delay: 0,
    gravity: 0.24,
    originX: 0.5,
    originY: 0.38,
    speedMax: 12.4,
    speedMin: 8.8,
    spread: Math.PI * 0.82,
  },
  {
    count: 46,
    delay: 0.14,
    gravity: 0.22,
    originX: 0.46,
    originY: 0.36,
    speedMax: 10.8,
    speedMin: 7.4,
    spread: Math.PI * 0.74,
  },
  {
    count: 46,
    delay: 0.2,
    gravity: 0.22,
    originX: 0.54,
    originY: 0.36,
    speedMax: 10.8,
    speedMin: 7.4,
    spread: Math.PI * 0.74,
  },
];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createParticle(
  width: number,
  height: number,
  burst: BurstConfig,
): ConfettiParticle {
  const angle =
    -Math.PI / 2 - burst.spread / 2 + Math.random() * burst.spread;
  const speed = randomBetween(burst.speedMin, burst.speedMax);
  const shapeRoll = Math.random();
  const shape =
    shapeRoll > 0.8 ? "circle" : shapeRoll > 0.45 ? "rect" : "streamer";
  const size = randomBetween(6, 12);

  return {
    color:
      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ??
      CONFETTI_COLORS[0],
    gravity: burst.gravity + randomBetween(0.015, 0.05),
    height: shape === "streamer" ? size * randomBetween(2.2, 3.2) : size * 1.55,
    life: 0,
    maxLife: randomBetween(110, 150),
    opacity: randomBetween(0.16, 0.34),
    rotation: randomBetween(-180, 180),
    rotationVelocity: randomBetween(-14, 14),
    shape,
    size,
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed - randomBetween(0.4, 1.6),
    width: shape === "circle" ? size : size * randomBetween(0.85, 1.3),
    wobble: randomBetween(0, Math.PI * 2),
    wobbleAmplitude: randomBetween(0.8, 2.8),
    wobbleVelocity: randomBetween(0.07, 0.16),
    x: width * burst.originX,
    y: height * burst.originY,
  };
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: ConfettiParticle,
  alpha: number,
) {
  ctx.save();
  ctx.translate(
    particle.x + Math.sin(particle.wobble) * particle.wobbleAmplitude,
    particle.y,
  );
  ctx.rotate((particle.rotation * Math.PI) / 180);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = particle.color;

  if (particle.shape === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, particle.width * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(
      -particle.width / 2,
      -particle.height / 2,
      particle.width,
      particle.height,
    );
  }

  ctx.restore();
}

export default function SubmissionCelebration({
  celebrationKey,
  children,
  className = "",
}: Props) {
  const prefersReducedMotion = useReducedMotion();
  const [activeCelebrationKey, setActiveCelebrationKey] = useState(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setActiveCelebrationKey(0);
      return;
    }

    if (celebrationKey > 0) {
      setActiveCelebrationKey(celebrationKey);
    }
  }, [celebrationKey, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion || activeCelebrationKey === 0) {
      return;
    }

    const overlay = overlayRef.current;
    const canvas = canvasRef.current;
    const glow = glowRef.current;

    if (!overlay || !canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const delayedCalls: gsap.core.Tween[] = [];
    let rafFinished = false;

    const resizeCanvas = () => {
      const rect = overlay.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnBurst = (burst: BurstConfig) => {
      const rect = overlay.getBoundingClientRect();
      const spawned = Array.from({ length: burst.count }, () =>
        createParticle(rect.width, rect.height, burst),
      );
      particlesRef.current = [...particlesRef.current, ...spawned];
    };

    const render = () => {
      const rect = overlay.getBoundingClientRect();
      const delta = Math.min(gsap.ticker.deltaRatio(60), 2.4);

      ctx.clearRect(0, 0, rect.width, rect.height);

      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.life += delta;
        particle.x += particle.velocityX * delta;
        particle.y += particle.velocityY * delta;
        particle.velocityX *= Math.pow(0.987, delta);
        particle.velocityY += particle.gravity * delta;
        particle.rotation += particle.rotationVelocity * delta;
        particle.wobble += particle.wobbleVelocity * delta;

        const progress = particle.life / particle.maxLife;
        if (progress >= 1) {
          return false;
        }

        const alpha =
          progress < 0.16
            ? particle.opacity * (progress / 0.16)
            : progress > 0.7
              ? particle.opacity * Math.max(0, (1 - progress) / 0.3)
              : particle.opacity;

        drawParticle(ctx, particle, alpha);
        return true;
      });

      if (
        particlesRef.current.length === 0 &&
        delayedCalls.every((call) => !call.isActive())
      ) {
        rafFinished = true;
        gsap.ticker.remove(render);
      }
    };

    resizeCanvas();
    particlesRef.current = [];
    gsap.set(overlay, { opacity: 1 });

    CONFETTI_BURSTS.forEach((burst) => {
      delayedCalls.push(
        gsap.delayedCall(burst.delay, () => {
          spawnBurst(burst);
        }),
      );
    });

    gsap.ticker.add(render);
    window.addEventListener("resize", resizeCanvas);

    if (glow) {
      gsap.fromTo(
        glow,
        { opacity: 0, scale: 0.28 },
        {
          opacity: 0.18,
          scale: 1.6,
          duration: 0.34,
          ease: "power2.out",
          yoyo: true,
          repeat: 1,
        },
      );
    }

    gsap.to(overlay, {
      opacity: 0,
      duration: 0.5,
      delay: 2.75,
      ease: "power2.out",
    });

    const timeoutId = window.setTimeout(() => {
      setActiveCelebrationKey((current) =>
        current === activeCelebrationKey ? 0 : current,
      );
    }, 3200);

    return () => {
      delayedCalls.forEach((call) => call.kill());
      particlesRef.current = [];
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", resizeCanvas);
      if (!rafFinished) {
        gsap.ticker.remove(render);
      }
      gsap.killTweensOf(overlay);
      if (glow) {
        gsap.killTweensOf(glow);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [activeCelebrationKey, prefersReducedMotion]);

  const showCelebration = activeCelebrationKey > 0 && !prefersReducedMotion;

  return (
    <div className={`relative isolate ${className}`}>
      {showCelebration ? (
        <div
          key={`celebration-${activeCelebrationKey}`}
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 z-30 overflow-hidden opacity-0"
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

          <div
            ref={glowRef}
            className="absolute left-1/2 top-[30%] h-24 w-24 -translate-x-1/2 rounded-full bg-white/25 blur-2xl"
          />
        </div>
      ) : null}

      <motion.div
        key={`celebration-content-${celebrationKey}`}
        className="relative z-10"
        initial={
          showCelebration ? { opacity: 0, y: 18, scale: 0.985 } : undefined
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
