import { motion } from "framer-motion";
import { Spinner } from "@/components/ui";

export default function PollsLoadingState() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-3 py-16 sm:py-24"
    >
      <Spinner size={32} className="text-primary-500" />
      <p className="text-sm text-gray-400">Loading polls...</p>
    </motion.div>
  );
}

