import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FormField, FieldType, FormSection } from "@/types/form";
import {
  TrashSimpleIcon,
  CopySimpleIcon,
  DotsNineIcon,
  DotsThreeIcon,
  TextTIcon,
  AlignLeftIcon,
  RadioButtonIcon,
  CheckSquareIcon,
  CaretDownIcon,
  CalendarBlankIcon,
  ClockIcon,
  EnvelopeIcon,
  FileArrowUpIcon,
  CheckIcon,
  ImageIcon,
  StarIcon,
  SlidersHorizontalIcon,
} from "@phosphor-icons/react";
import RichInput from "../utils/RichInput";
import { ResizableImage } from "../utils/ResizableImage";
import { ResponseValidation } from "../utils/ResponseValidation";
import { RatingSection } from "./RatingSection";
import OptionsSection from "./OptionsSection";
import ShortTextField from "./ShortTextField";
import ParagraphField from "./ParagraphField";
import DateField from "./DateField";
import TimeField from "./TimeField";
import EmailField from "./EmailField";
import FileUploadField from "./FileUploadField";
import { LinearScaleField } from "./LinearScaleField";

type PhosphorIconProps = {
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
};

type QuestionFieldType = Exclude<FieldType, "title_block" | "image_block">;

const FIELD_TYPE_CONFIG: Record<
  QuestionFieldType,
  { label: string; Icon: React.ComponentType<PhosphorIconProps> }
> = {
  short_text: { label: "Short answer", Icon: TextTIcon },
  paragraph: { label: "Paragraph", Icon: AlignLeftIcon },
  multiple_choice: { label: "Multiple choice", Icon: RadioButtonIcon },
  checkbox: { label: "Checkboxes", Icon: CheckSquareIcon },
  dropdown: { label: "Dropdown", Icon: CaretDownIcon },
  date: { label: "Date", Icon: CalendarBlankIcon },
  time: { label: "Time", Icon: ClockIcon },
  email: { label: "Email", Icon: EnvelopeIcon },
  file_upload: { label: "File upload", Icon: FileArrowUpIcon },
  rating: { label: "Rating", Icon: StarIcon },
  linear_scale: { label: "Linear scale", Icon: SlidersHorizontalIcon },
};

type Props = {
  field: FormField;
  sections?: FormSection[];
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  accentColor?: string;
};

export default function QuestionCard({
  field,
  sections,
  isSelected,
  onSelect,
  onChange,
  onDelete,
  onDuplicate,
  accentColor,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [dropdownUp, setDropdownUp] = useState(false);
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState(400);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showBranching, setShowBranching] = useState(true);
  const [openBranchIdx, setOpenBranchIdx] = useState<number | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const typeButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const branchContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const headerImgRef = useRef<HTMLInputElement>(null);
  const qHeaderImgRef = useRef<HTMLInputElement>(null);
  const imgBlockRef = useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) setTypeDropdownOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      let insideBranch = false;
      branchContainerRefs.current.forEach((el) => { if (el?.contains(e.target as Node)) insideBranch = true; });
      if (!insideBranch) setOpenBranchIdx(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasOptions = useMemo(() => ["multiple_choice", "checkbox", "dropdown"].includes(field.type), [field.type]);
  const canBranch = useMemo(() => sections && sections.length > 1 && ["multiple_choice", "checkbox", "dropdown"].includes(field.type), [sections, field.type]);
  const canShuffle = useMemo(() => ["multiple_choice", "checkbox", "dropdown"].includes(field.type), [field.type]);
  const canValidate = useMemo(() => ["short_text", "paragraph", "email"].includes(field.type), [field.type]);
  const hasBranching = canBranch && showBranching;

  const config = useMemo(
    () => field.type !== "title_block" && field.type !== "image_block" ? FIELD_TYPE_CONFIG[field.type as QuestionFieldType] : null,
    [field.type],
  );

  const cardClass = useMemo(
    () => `bg-white rounded-lg shadow-sm cursor-pointer transition-all duration-150 ${
      isSelected ? "border-l-4 border-gray-200 shadow-md" : "border border-gray-200 hover:border-gray-300"
    }`,
    [isSelected],
  );

  const accentStyle = useMemo(
    () => isSelected ? { borderLeftColor: accentColor ?? "#0054a5" } : undefined,
    [isSelected, accentColor],
  );

  const getBranchLabel = useCallback(
    (target: string) => {
      if (target === "next") return "Continue to next section";
      if (target === "end") return "Submit form";
      const idx = sections?.findIndex((s) => s.id === target) ?? -1;
      if (idx === -1) return "Continue to next section";
      const s = sections![idx];
      return s.title?.trim() ? s.title.trim() : `Section ${idx + 1}`;
    },
    [sections],
  );

  const handleTypeDropdownOpen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setTypeDropdownOpen((prev) => {
      if (!prev) {
        const rect = typeButtonRef.current?.getBoundingClientRect();
        if (rect) {
          const mobileToolbar = window.innerWidth < 640 ? 56 : 0;
          const spaceBelow = window.innerHeight - rect.bottom - mobileToolbar;
          const spaceAbove = rect.top - 72;
          const isUp = spaceBelow < 320;
          setDropdownUp(isUp);
          setDropdownMaxHeight(Math.max(160, isUp ? spaceAbove - 8 : spaceBelow - 8));
        }
      }
      return !prev;
    });
  }, [onSelect]);

  if (field.type === "title_block") {
    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onSelect}
          className={`group ${cardClass}`}
          style={accentStyle}
        >
          <div {...listeners} onClick={(e) => e.stopPropagation()} className="flex justify-center py-1.5 cursor-grab active:cursor-grabbing text-gray-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-none">
            <DotsNineIcon size={20} weight="bold" />
          </div>
          <div className="px-4 sm:px-6 pb-5 pt-1" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-2 sm:gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <RichInput value={field.label} onChange={(v) => onChange({ label: v })} placeholder="Title" className="text-lg font-semibold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-primary-400 pb-1 transition-colors w-full" stopPropagation noLists />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); headerImgRef.current?.click(); }}
                title="Add image"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 border border-gray-200 hover:text-primary-500 hover:border-primary-200 hover:bg-primary-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0"
              >
                <ImageIcon size={17} />
              </button>
            </div>
            {field.headerImage && (
              <div className="relative group/img rounded-lg overflow-hidden mb-3">
                <img src={field.headerImage} className="w-full max-h-40 object-cover rounded-lg" alt="" />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover/img:opacity-100">
                  <button onClick={(e) => { e.stopPropagation(); headerImgRef.current?.click(); }} className="bg-white/90 hover:bg-white text-gray-800 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors">Change</button>
                  <button onClick={(e) => { e.stopPropagation(); onChange({ headerImage: undefined }); }} className="bg-white/90 hover:bg-white text-red-600 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors">Remove</button>
                </div>
              </div>
            )}
            <input ref={headerImgRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange({ headerImage: URL.createObjectURL(f) }); e.target.value = ""; }} />
            <RichInput value={field.description ?? ""} onChange={(v) => onChange({ description: v || undefined })} placeholder="Description (optional)" className="text-sm text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-gray-300 pb-0.5 transition-colors w-full" stopPropagation />
            <div className="flex items-center justify-end gap-1 mt-4 pt-3">
              <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors" title="Duplicate"><CopySimpleIcon size={17} /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete"><TrashSimpleIcon size={17} /></button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (field.type === "image_block") {
    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onSelect}
          className={`group ${cardClass}`}
          style={accentStyle}
        >
          <div {...listeners} onClick={(e) => e.stopPropagation()} className="flex justify-center py-1.5 cursor-grab active:cursor-grabbing text-gray-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-none">
            <DotsNineIcon size={20} weight="bold" />
          </div>
          <div className="px-4 sm:px-6 pb-5 pt-1" onClick={(e) => e.stopPropagation()}>
            {field.headerImage ? (
              <ResizableImage src={field.headerImage} imgRef={imgBlockRef} imageWidth={field.imageWidth} imageAlign={field.imageAlign} imageCaption={field.imageCaption} onUpdate={onChange} onRemove={() => onChange({ headerImage: undefined, imageCaption: undefined })} />
            ) : (
              <button onClick={(e) => { e.stopPropagation(); imgBlockRef.current?.click(); }} className="w-full h-32 border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:text-gray-500 transition-colors">
                <ImageIcon size={22} />
                <span className="text-sm">Click to add image</span>
              </button>
            )}
            <input ref={imgBlockRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange({ headerImage: URL.createObjectURL(f), imageWidth: 100, imageAlign: "left" }); e.target.value = ""; }} />
            {isSelected && (
              <div className="flex items-center justify-end gap-1 mt-4 pt-3">
                <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><CopySimpleIcon size={17} /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><TrashSimpleIcon size={17} /></button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.12 }}
        onClick={onSelect}
        className={`group ${cardClass}${isSelected ? " relative z-40" : ""}`}
        style={accentStyle}
      >
        <div {...listeners} onClick={(e) => e.stopPropagation()} className="flex justify-center py-1.5 cursor-grab active:cursor-grabbing text-gray-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-none">
          <DotsNineIcon size={20} weight="bold" />
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1">
          <div onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-start gap-2 sm:gap-3 mb-3">
              <div className="w-full sm:flex-1 sm:min-w-0">
                <RichInput value={field.label} onChange={(v) => onChange({ label: v })} placeholder="Question" className="text-[15px] font-medium border-b-2 border-transparent hover:border-gray-200 focus:border-primary-500 pb-1 transition-colors w-full text-gray-900" stopPropagation noLists />
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); qHeaderImgRef.current?.click(); }}
                title="Add header image"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 border border-gray-200 hover:text-primary-500 hover:border-primary-200 hover:bg-primary-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0"
              >
                <ImageIcon size={17} />
              </button>

              <div ref={typeDropdownRef} className="relative flex-1 sm:flex-none sm:w-auto sm:shrink-0">
                <button
                  ref={typeButtonRef}
                  onClick={handleTypeDropdownOpen}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 border border-gray-200 hover:border-gray-300 rounded-lg bg-white transition-colors w-full sm:w-44 justify-between"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700 min-w-0">
                    {config && <config.Icon size={15} className="shrink-0" />}
                    <span className="text-sm truncate">{config?.label}</span>
                  </div>
                  <CaretDownIcon size={13} className={`text-gray-400 shrink-0 transition-transform duration-150 ${typeDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {typeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: dropdownUp ? 4 : -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: dropdownUp ? 4 : -4, scale: 0.97 }}
                      transition={{ duration: 0.1 }}
                      className={`absolute right-0 ${dropdownUp ? "bottom-full mb-1" : "top-full mt-1"} w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-y-auto`}
                      style={{ maxHeight: dropdownMaxHeight }}
                    >
                      {(Object.entries(FIELD_TYPE_CONFIG) as [QuestionFieldType, (typeof FIELD_TYPE_CONFIG)[QuestionFieldType]][]).map(([type, { label, Icon }]) => (
                        <button
                          key={type}
                          onClick={(e) => { e.stopPropagation(); onChange({ type }); setTypeDropdownOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${
                            field.type === type ? "text-primary-600 bg-primary-50 font-medium" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <Icon size={17} className="shrink-0" />
                          {label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {field.headerImage && (
              <div className="mt-3">
                <ResizableImage src={field.headerImage} imgRef={qHeaderImgRef} imageWidth={field.imageWidth} imageAlign={field.imageAlign} imageCaption={field.imageCaption} onUpdate={onChange} onRemove={() => onChange({ headerImage: undefined, imageCaption: undefined })} />
              </div>
            )}

            {field.description != null && (
              <div className="mb-3">
                <RichInput value={field.description} onChange={(v) => onChange({ description: v || undefined })} placeholder="Description" className="text-sm text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-primary-400 pb-0.5 transition-colors w-full" stopPropagation />
              </div>
            )}

            {field.type === "short_text" && <ShortTextField placeholder={field.placeholder} onChange={(v) => onChange({ placeholder: v })} />}
            {field.type === "paragraph" && <ParagraphField placeholder={field.placeholder} onChange={(v) => onChange({ placeholder: v })} />}
            {field.type === "date" && <DateField />}
            {field.type === "time" && <TimeField />}
            {field.type === "email" && <EmailField placeholder={field.placeholder} onChange={(v) => onChange({ placeholder: v })} />}
            {field.type === "file_upload" && (
              <FileUploadField
                allowedFileTypes={field.allowedFileTypes}
                maxFileCount={field.maxFileCount}
                maxFileSizeMb={field.maxFileSizeMb}
                onChange={onChange}
              />
            )}
            {field.type === "rating" && <RatingSection scaleMax={field.scaleMax} ratingIcon={field.ratingIcon} minLabel={field.minLabel} maxLabel={field.maxLabel} isSelected={isSelected} onChange={onChange} />}
            {field.type === "linear_scale" && <LinearScaleField scaleMin={field.scaleMin} scaleMax={field.scaleMax} minLabel={field.minLabel} maxLabel={field.maxLabel} onChange={onChange} />}
            {hasOptions && (
              <OptionsSection
                field={field}
                sections={sections}
                hasBranching={!!hasBranching}
                openBranchIdx={openBranchIdx}
                onOpenBranch={setOpenBranchIdx}
                branchContainerRefs={branchContainerRefs}
                getBranchLabel={getBranchLabel}
                onChange={onChange}
              />
            )}

            {(showAnswerKey || field.correctAnswer !== undefined) && (field.type === "multiple_choice" || field.type === "checkbox" || canValidate) && (
              <ResponseValidation field={field} canValidate={canValidate} onChange={onChange} />
            )}

            <input ref={qHeaderImgRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange({ headerImage: URL.createObjectURL(f), imageWidth: 100, imageAlign: "left" }); e.target.value = ""; }} />

            <div className="flex items-center justify-end gap-1 mt-4 pt-3 flex-wrap">
              <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors" title="Duplicate"><CopySimpleIcon size={17} /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete"><TrashSimpleIcon size={17} /></button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <div className="flex items-center gap-2 cursor-pointer select-none" onClick={(e) => { e.stopPropagation(); onChange({ required: !field.required }); }}>
                <span className={`text-xs transition-colors ${field.required ? "text-primary-600 font-medium" : "text-gray-500"}`}>Required</span>
                <div className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${field.required ? "bg-primary-500" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${field.required ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </div>

              <div ref={menuRef} className="relative">
                <button onClick={(e) => { e.stopPropagation(); onSelect(); setMenuOpen((v) => !v); }} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <DotsThreeIcon size={20} weight="bold" />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 bottom-full mb-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden"
                    >
                      <div className="px-4 py-1.5 mb-0.5">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Show</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onChange({ description: field.description != null ? undefined : "" }); setMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors text-left">
                        Description
                        {field.description != null && <CheckIcon size={16} className="text-primary-500 shrink-0" weight="bold" />}
                      </button>
                      {(field.type === "multiple_choice" || field.type === "checkbox" || canValidate) && (
                        <button onClick={(e) => { e.stopPropagation(); onSelect(); setShowAnswerKey((v) => !v); setMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors text-left">
                          Response validation
                          {(showAnswerKey || field.correctAnswer !== undefined) && <CheckIcon size={16} className="text-primary-500 shrink-0" weight="bold" />}
                        </button>
                      )}
                      {canBranch && (
                        <button onClick={(e) => { e.stopPropagation(); const next = !showBranching; setShowBranching(next); if (!next) onChange({ branches: undefined }); setMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors text-left">
                          Open section based on answer
                          {showBranching && <CheckIcon size={16} className="text-primary-500 shrink-0" weight="bold" />}
                        </button>
                      )}
                      {canShuffle && (
                        <button onClick={(e) => { e.stopPropagation(); onChange({ shuffleOptions: !field.shuffleOptions }); setMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors text-left">
                          Shuffle option order
                          {field.shuffleOptions && <CheckIcon size={16} className="text-primary-500 shrink-0" weight="bold" />}
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
