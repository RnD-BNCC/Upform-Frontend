import { AnimatePresence, motion } from "framer-motion";
import { X } from "@phosphor-icons/react";
import type { PollSlide } from "@/types/polling";

interface SlideGridModalProps {
  open: boolean;
  onClose: () => void;
  slides: PollSlide[];
  currentSlide: number;
  onGoToSlide: (index: number) => void;
}

export default function SlideGridModal({
  open,
  onClose,
  slides,
  currentSlide,
  onGoToSlide,
}: SlideGridModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">All Slides</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => onGoToSlide(i)}
                  className={`relative flex flex-col gap-1.5 p-3 rounded-xl border-2 text-left cursor-pointer transition-all hover:shadow-md ${
                    currentSlide === i
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold ${
                      currentSlide === i ? "text-primary-600" : "text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-snug">
                    {slide.question
                      ? slide.question.replace(/<[^>]*>/g, "").slice(0, 60)
                      : "Untitled"}
                  </p>
                  <span className="text-[9px] text-gray-400 font-medium capitalize">
                    {(slide.type as string).replace("_", " ")}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
