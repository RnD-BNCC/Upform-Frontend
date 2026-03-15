import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircleIcon,
  TextTIcon,
  ImageIcon,
  RowsIcon,
} from "@phosphor-icons/react";

type Props = {
  onAddQuestion: () => void;
  onAddTitleBlock: () => void;
  onAddSection: () => void;
  onAddImageBlock: (url: string) => void;
};

type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";

type ToolbarBtn = {
  Icon: React.ComponentType<{
    size?: number;
    weight?: IconWeight;
    className?: string;
  }>;
  title: string;
  onClick: () => void;
};

export default function FieldTypeSidebar({
  onAddQuestion,
  onAddTitleBlock,
  onAddSection,
  onAddImageBlock,
}: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const buttons: ToolbarBtn[] = [
    { Icon: PlusCircleIcon, title: "Add question", onClick: onAddQuestion },
    {
      Icon: TextTIcon,
      title: "Add title & description",
      onClick: onAddTitleBlock,
    },
    {
      Icon: ImageIcon,
      title: "Add image",
      onClick: () => imgInputRef.current?.click(),
    },
    { Icon: RowsIcon, title: "Add section", onClick: onAddSection },
  ];

  return (
    <>
      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAddImageBlock(URL.createObjectURL(file));
          e.target.value = "";
        }}
      />

      {/* Desktop sidebar */}
      <div className="hidden sm:flex flex-col bg-white rounded-2xl shadow-sm px-2 py-3 items-center gap-1.5 sticky top-20 self-start shrink-0">
        {buttons.map(({ Icon, title, onClick }, i) => (
          <div
            key={title}
            className="relative"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <motion.button
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.15 }}
              whileTap={{ scale: 0.92 }}
              onClick={onClick}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all text-gray-500 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
            >
              <Icon size={22} weight="regular" />
            </motion.button>

            <AnimatePresence>
              {hoveredIdx === i && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none z-50"
                >
                  {title}
                  <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-800" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Mobile bottom toolbar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200 mx-10 rounded-t-2xl ">
        <div className="flex items-center">
          {buttons.map(({ Icon, title, onClick }) => (
            <button
              key={title}
              onClick={onClick}
              title={title}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 text-gray-500 active:text-primary-600 active:bg-primary-50 transition-colors"
            >
              <Icon size={22} weight="regular" />
              <span className="text-[10px] text-gray-400 leading-none">
                {title.replace("Add ", "")}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
