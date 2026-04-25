import { motion } from "framer-motion";
import { X } from "@phosphor-icons/react";

type Props = {
  url: string;
  filename: string;
  onClose: () => void;
};

export default function ImagePreviewModal({
  url,
  filename,
  onClose,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="relative max-w-4xl w-full"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={url}
          alt={filename}
          className="max-h-[85vh] w-full object-contain rounded-xl"
        />
        <p className="text-white/60 text-xs text-center mt-2 truncate">
          {filename}
        </p>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={14} weight="bold" />
        </button>
      </motion.div>
    </motion.div>
  );
}

