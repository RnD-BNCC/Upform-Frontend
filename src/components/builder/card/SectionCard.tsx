import { motion } from "framer-motion";
import { TrashSimpleIcon } from "@phosphor-icons/react";
import type { FormSection } from "@/types/form";
import RichInput from "../utils/RichInput";

type SectionCardProps = {
  section: FormSection;
  sectionIdx: number;
  totalSections: number;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onDelete: () => void;
  accentColor?: string;
};

export default function SectionCard({
  section,
  sectionIdx,
  totalSections,
  onTitleChange,
  onDescriptionChange,
  onDelete,
  accentColor = "#0054a5",
}: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
    >
      <div className="mb-2">
        <span
          className="text-white text-xs font-semibold px-3 py-1 rounded-full"
          style={{ backgroundColor: accentColor }}
        >
          Section {sectionIdx + 1} of {totalSections}
        </span>
      </div>
      <div className="bg-white rounded-sm shadow-sm overflow-hidden">
        <div className="h-1" style={{ backgroundColor: accentColor }} />
        <div
          className="px-5 py-4 border-l-4"
          style={{ borderColor: accentColor }}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={section.title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Untitled Section"
                className="w-full text-base font-medium text-gray-900 outline-none border-b border-transparent hover:border-gray-200 focus:border-primary-500 bg-transparent pb-0.5 transition-colors"
              />
              <div className="mt-2">
                <RichInput
                  value={section.description ?? ""}
                  onChange={(html) => onDescriptionChange(html)}
                  placeholder="Description (optional)"
                  stopPropagation
                  className="text-sm placeholder:text-xs text-gray-900 w-full border-b border-transparent focus:border-gray-300 pb-0.5 transition-colors leading-normal"
                />
              </div>
            </div>
            <button
              onClick={onDelete}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 mt-0.5"
              title="Delete section"
            >
              <TrashSimpleIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
