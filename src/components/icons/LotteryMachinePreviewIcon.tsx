const PREVIEW_BALLS = [
  { color: "#e53935", left: 27, size: 23, top: 77 },
  { color: "#f4a020", left: 49, size: 25, top: 73 },
  { color: "#43a047", left: 72, size: 22, top: 78 },
  { color: "#8e24aa", left: 34, size: 22, top: 96 },
  { color: "#d81b60", left: 57, size: 24, top: 96 },
  { color: "#f7c948", left: 79, size: 21, top: 95 },
  { color: "#ef6c00", left: 45, size: 21, top: 113 },
  { color: "#6d4c41", left: 67, size: 23, top: 112 },
];

export default function LotteryMachinePreviewIcon() {
  return (
    <div className="relative h-44 w-44">
      <div className="absolute inset-x-5 bottom-2 h-5 rounded-full bg-gray-300/50 blur-md" />

      <div className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 flex-col items-center">
        <div className="h-5 w-8 rounded-t-full border-x border-t border-sky-200 bg-white/70" />
        <div className="h-2 w-14 rounded-full border border-sky-200 bg-white/80 shadow-sm" />
      </div>

      <div className="absolute left-1/2 top-8 h-[6.6rem] w-[6.6rem] -translate-x-1/2 overflow-hidden rounded-full border border-sky-200 bg-sky-50/60 shadow-[inset_0_0_30px_rgba(255,255,255,0.95),0_16px_34px_rgba(15,23,42,0.10)]">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_34%_24%,rgba(255,255,255,0.92),rgba(255,255,255,0.2)_30%,rgba(14,165,233,0.10)_68%,rgba(15,23,42,0.08)_100%)]" />
        {PREVIEW_BALLS.map((ball, index) => (
          <span
            key={`${ball.color}-${index}`}
            className="absolute rounded-full border border-white/80 shadow-[inset_-3px_-4px_8px_rgba(15,23,42,0.24),inset_2px_2px_5px_rgba(255,255,255,0.88),0_3px_8px_rgba(15,23,42,0.14)]"
            style={{
              background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${ball.color} 48%, rgba(15,23,42,0.34) 100%)`,
              height: `${ball.size}px`,
              left: `${ball.left}px`,
              top: `${ball.top}px`,
              width: `${ball.size}px`,
            }}
          />
        ))}
        <div className="absolute left-5 top-4 h-5 w-9 rounded-full bg-white/70 blur-[2px]" />
        <div className="absolute right-3 top-8 h-12 w-4 rounded-full bg-white/30 blur-sm" />
      </div>

      <div className="absolute bottom-7 left-1/2 h-8 w-16 -translate-x-1/2 border-x border-sky-200 bg-sky-50/70" />
      <div className="absolute bottom-5 left-1/2 h-3 w-24 -translate-x-1/2 rounded-full border border-sky-200 bg-white shadow-sm" />
    </div>
  );
}
