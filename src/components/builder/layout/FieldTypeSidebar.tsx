import { useState } from "react";
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
  mobileLabel: string;
} & ({ onClick: () => void; htmlFor?: never } | { htmlFor: string; onClick?: never });

const IMG_INPUT_ID = "sidebar-img-upload";

export default function FieldTypeSidebar({
  onAddQuestion,
  onAddTitleBlock,
  onAddSection,
  onAddImageBlock,
}: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const buttons: ToolbarBtn[] = [
    { Icon: PlusCircleIcon, title: "Add question", mobileLabel: "question", onClick: onAddQuestion },
    { Icon: TextTIcon, title: "Add title & description", mobileLabel: "title", onClick: onAddTitleBlock },
    { Icon: ImageIcon, title: "Add image", mobileLabel: "image", htmlFor: IMG_INPUT_ID },
    { Icon: RowsIcon, title: "Add section", mobileLabel: "section", onClick: onAddSection },
  ];

  return (
    <>
      <input
        id={IMG_INPUT_ID}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAddImageBlock(URL.createObjectURL(file));
          e.target.value = "";
        }}
      />

      <div className="hidden sm:flex flex-col bg-white rounded-2xl shadow-sm px-2 py-3 items-center gap-1.5 sticky top-20 self-start shrink-0">
        {buttons.map(({ Icon, title, onClick, htmlFor }, i) => (
          <div
            key={title}
            className="relative"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {htmlFor ? (
              <motion.label
                htmlFor={htmlFor}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.15 }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all text-gray-500 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
              >
                <Icon size={22} weight="regular" />
              </motion.label>
            ) : (
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
            )}

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

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200 mx-10 rounded-t-2xl">
        <div className="flex items-stretch">
          {buttons.map(({ Icon, title, mobileLabel, onClick, htmlFor }) => {
            const inner = (
              <>
                <Icon size={22} weight="regular" />
                <span className="text-[10px] text-gray-400 leading-none">
                  {mobileLabel}
                </span>
              </>
            );
            const cls =
              "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-gray-500 active:text-primary-600 active:bg-primary-50 transition-colors";

            return htmlFor ? (
              <label key={title} htmlFor={htmlFor} title={title} className={`${cls} cursor-pointer`}>
                {inner}
              </label>
            ) : (
              <button key={title} onClick={onClick} title={title} className={cls}>
                {inner}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
