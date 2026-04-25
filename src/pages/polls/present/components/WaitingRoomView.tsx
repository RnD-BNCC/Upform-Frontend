import { motion } from "framer-motion";
import { PASTEL_COLORS } from "@/utils/form/responseAggregation";
import type { Participant } from "@/types/polling";
import type { WaitingRoomViewProps } from "./types";

function FloatingAvatars({ participants }: { participants: Participant[] }) {
  if (participants.length === 0) return null;

  return (
    <div className="relative w-full max-w-2xl h-48 my-4">
      {participants.map((p, i) => {
        const hash =
          p.id.charCodeAt(0) + p.id.charCodeAt(Math.min(p.id.length - 1, 5));
        const x = ((hash * 37 + i * 89) % 70) + 15;
        const y = ((hash * 53 + i * 67) % 50) + 25;
        const color = PASTEL_COLORS[i % PASTEL_COLORS.length];

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: [0, 12, -8, 0],
              y: [0, -10, 6, 0],
            }}
            transition={{
              opacity: { duration: 0.4, delay: i * 0.1 },
              scale: { duration: 0.4, delay: i * 0.1 },
              x: { repeat: Infinity, duration: 3 + (i % 3), ease: "easeInOut" },
              y: { repeat: Infinity, duration: 4 + (i % 2), ease: "easeInOut" },
            }}
            className="absolute flex flex-col items-center gap-1"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div
              className="w-14 h-14 rounded-full overflow-hidden bg-primary-50 shadow-lg"
              style={{ outline: `2px solid ${color}` }}
            >
              <img
                src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${p.avatarSeed || p.id}`}
                alt={p.name}
                className="w-full h-full"
                loading="lazy"
              />
            </div>
            <span className="text-[11px] font-semibold text-gray-600 bg-white/90 rounded-full px-2 py-0.5 truncate max-w-20 shadow-sm">
              {p.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function WaitingRoomView({
  imageUrl,
  imageLayout,
  currentSlide,
  totalSlides,
  participants,
  textColor,
}: WaitingRoomViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 pb-20 relative">
      <div className="relative z-[1] flex flex-col items-center">
        {imageUrl && imageLayout !== "full" && (
          <div className="flex justify-center mb-6">
            <div className="max-h-48 max-w-full overflow-hidden rounded-xl">
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
          </div>
        )}
        <p
          className="text-base font-medium opacity-50 mb-2"
          style={{ color: textColor }}
        >
          Question{" "}
          <span className="text-2xl font-black">{currentSlide + 1}</span> of{" "}
          <span className="text-2xl font-black">{totalSlides}</span>
        </p>
        <FloatingAvatars participants={participants} />
        <p className="text-sm font-bold mt-4" style={{ color: textColor }}>
          {participants.length} player
          {participants.length !== 1 ? "s" : ""} ready!
        </p>
      </div>
    </div>
  );
}
