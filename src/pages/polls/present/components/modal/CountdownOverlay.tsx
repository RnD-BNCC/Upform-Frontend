import { AnimatePresence, motion } from "framer-motion";

interface CountdownOverlayProps {
  countdown: number | null;
}

export default function CountdownOverlay({ countdown }: CountdownOverlayProps) {
  return (
    <AnimatePresence>
      {countdown !== null && (
        <motion.div
          className="absolute inset-0 z-[70] bg-primary-800 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={countdown}
              initial={{ scale: 2.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-[120px] font-black text-white select-none"
            >
              {countdown === 0 ? "GO!" : countdown}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
