import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "@/components/ui";

interface RestartingOverlayProps {
  restarting: boolean;
}

export default function RestartingOverlay({ restarting }: RestartingOverlayProps) {
  return (
    <AnimatePresence>
      {restarting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <Spinner size={40} className="text-white" />
            <span className="text-white font-semibold text-sm">
              Restarting...
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
