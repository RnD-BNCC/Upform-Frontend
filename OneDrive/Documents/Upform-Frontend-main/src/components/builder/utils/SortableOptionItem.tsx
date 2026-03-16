import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DotsSixVerticalIcon,
  ImageIcon,
  XIcon,
  CaretDownIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import type { FieldType, FormSection } from "@/types/form";

export type SortableOptionItemProps = {
  id: string;
  index: number;
  value: string;
  imageUrl?: string;
  fieldType: FieldType;
  hasBranching: boolean;
  sections?: FormSection[];
  branches?: Record<string, string>;
  openBranchIdx: number | null;
  branchContainerRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  getBranchLabel: (target: string) => string;
  onUpdate: (value: string) => void;
  onRemove: () => void;
  onSetBranch: (target: string) => void;
  onOpenBranch: (idx: number | null) => void;
  onImageUpload: (url: string) => void;
};

export function SortableOptionItem({
  id,
  index,
  value,
  imageUrl,
  fieldType,
  hasBranching,
  sections,
  branches,
  openBranchIdx,
  branchContainerRefs,
  getBranchLabel,
  onUpdate,
  onRemove,
  onSetBranch,
  onOpenBranch,
  onImageUpload,
}: SortableOptionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageUpload(URL.createObjectURL(file));
    e.target.value = "";
  };

  const currentBranch = branches?.[value] ?? "next";

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="group/opt relative flex flex-wrap items-center gap-x-2 py-2 rounded hover:bg-gray-50/70">
        <div
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/opt:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 text-gray-400 hover:text-gray-600 touch-none z-10"
        >
          <DotsSixVerticalIcon size={16} />
        </div>

        {fieldType === "multiple_choice" && <div className="w-5 h-5 rounded-full border-2 border-gray-400 shrink-0" />}
        {fieldType === "checkbox" && <div className="w-5 h-5 rounded border-2 border-gray-400 shrink-0" />}
        {fieldType === "dropdown" && (
          <span className="text-sm text-gray-400 w-5 shrink-0 text-right">{index + 1}.</span>
        )}

        <input
          type="text"
          value={value}
          onChange={(e) => onUpdate(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 hover:[box-shadow:0_1.5px_0_0_#d1d5db] focus:[box-shadow:0_1.5px_0_0_#0054a5] text-[15px] text-gray-800 outline-none bg-transparent pb-0.5 transition-all min-w-0"
        />

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        <button
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          className="opacity-0 group-hover/opt:opacity-100 transition-opacity p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0 min-w-7 min-h-7 flex items-center justify-center"
        >
          <ImageIcon size={15} />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 text-gray-400 hover:text-gray-600 shrink-0 min-w-7 min-h-7 flex items-center justify-center"
        >
          <XIcon size={16} />
        </button>

        {hasBranching && (
          <div
            ref={(el) => {
              if (el) branchContainerRefs.current.set(index, el);
              else branchContainerRefs.current.delete(index);
            }}
            className="relative w-full sm:w-auto sm:shrink-0 pl-7 sm:pl-0 pb-3 sm:pb-0"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onOpenBranch(openBranchIdx === index ? null : index); }}
              className="flex items-center gap-1.5 text-xs text-primary-600 bg-transparent pb-0.5 pr-1 w-full sm:min-w-44 sm:w-auto justify-between transition-all hover:[box-shadow:0_1.5px_0_0_#99c1ef]"
            >
              <span className="truncate">{getBranchLabel(currentBranch)}</span>
              <CaretDownIcon
                size={16}
                className={`shrink-0 text-gray-400 transition-transform duration-150 ${openBranchIdx === index ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {openBranchIdx === index && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 bottom-full mb-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden"
                >
                  {(["next", ...(sections?.map((s) => s.id) ?? []), "end"] as string[]).map((target) => (
                    <button
                      key={target}
                      onClick={(e) => { e.stopPropagation(); onSetBranch(target); onOpenBranch(null); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                        currentBranch === target
                          ? "bg-gray-50 text-primary-600 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{getBranchLabel(target)}</span>
                      {currentBranch === target && (
                        <CheckIcon size={15} className="text-primary-500 shrink-0 ml-2" weight="bold" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {imageUrl && (
        <div className="ml-7 mb-1">
          <div className="relative group/imgpreview inline-block">
            <img src={imageUrl} className="max-h-36 max-w-xs rounded-md object-contain border border-gray-100" alt="" />
            <div className="absolute inset-0 bg-black/0 group-hover/imgpreview:bg-black/30 transition-colors rounded-md flex items-center justify-center gap-1.5 opacity-0 group-hover/imgpreview:opacity-100">
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="bg-white/90 hover:bg-white text-gray-800 text-xs px-2 py-1 rounded font-semibold transition-colors"
              >
                Change
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onImageUpload(""); }}
                className="bg-white/90 hover:bg-white text-red-600 text-xs px-2 py-1 rounded font-semibold transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
