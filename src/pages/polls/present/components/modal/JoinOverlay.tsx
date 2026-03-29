import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { X } from "@phosphor-icons/react";

interface JoinOverlayProps {
  open: boolean;
  onClose: () => void;
  joinUrl: string;
  code: string;
}

export default function JoinOverlay({
  open,
  onClose,
  joinUrl,
  code,
}: JoinOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-14 right-5 z-30 bg-white rounded-xl shadow-2xl p-5 text-center min-w-60"
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={14} weight="bold" />
          </button>
          <p className="text-xs text-gray-500 font-medium mb-2">Join at</p>
          <a
            href={`${joinUrl}/${code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-primary-600 hover:text-primary-700 mb-4 block no-underline"
          >
            {joinUrl}/{code}
          </a>
          <div className="flex justify-center mb-3">
            <QRCodeSVG value={`${joinUrl}/${code}`} size={140} level="M" />
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-widest">
            {code}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
