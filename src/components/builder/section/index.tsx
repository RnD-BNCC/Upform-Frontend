import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FormField, FormSection, FieldType } from "@/types/form";
import {
  TrashSimpleIcon,
  CopySimpleIcon,
  DotsNineIcon,
  GearSixIcon,
  ImageIcon,
  InfoIcon,
  CaretDownIcon,
  MapPinIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import RichInput from "../utils/RichInput";
import { ResizableImage } from "../utils/ResizableImage";
import { RatingSection } from "./RatingSection";
import ShortTextField from "./ShortTextField";
import ParagraphField from "./ParagraphField";
import DateField from "./DateField";
import TimeField from "./TimeField";
import EmailField from "./EmailField";
import FileUploadField from "./FileUploadField";
import { LinearScaleField } from "./LinearScaleField";

// ─── Banner color map ─────────────────────────────────────────────────────────

const BANNER_COLORS = {
  info:    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-900',   sub: 'text-blue-700',   icon: 'text-blue-500'   },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', sub: 'text-yellow-700', icon: 'text-yellow-500' },
  error:   { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-900',    sub: 'text-red-700',    icon: 'text-red-500'    },
  success: { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-900',  sub: 'text-green-700',  icon: 'text-green-500'  },
}

// ─── Change type map ──────────────────────────────────────────────────────────

const SIMILAR_TYPES: Partial<Record<FieldType, FieldType[]>> = {
  short_text: ["paragraph", "email", "number", "phone"],
  paragraph: ["short_text", "rich_text"],
  email: ["short_text", "phone"],
  multiple_choice: ["checkbox", "dropdown", "ranking"],
  checkbox: ["multiple_choice", "dropdown"],
  dropdown: ["multiple_choice", "checkbox"],
  number: ["short_text", "currency"],
  currency: ["number"],
  phone: ["short_text", "email"],
  date: ["time"],
  time: ["date"],
};

const FIELD_TYPE_LABELS: Partial<Record<FieldType, string>> = {
  short_text: "Short text",
  paragraph: "Paragraph",
  email: "Email",
  number: "Number",
  phone: "Phone",
  rich_text: "Rich text",
  checkbox: "Checkbox",
  multiple_choice: "Multiple choice",
  dropdown: "Dropdown",
  ranking: "Ranking",
  currency: "Currency",
  date: "Date",
  time: "Time",
};

type Props = {
  field: FormField;
  sections?: FormSection[];
  isSelected: boolean;
  onSelect: () => void;
  onOpenSettings?: () => void;
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
  onOpenSettings,
  onChange,
  onDelete,
  onDuplicate,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const headerImgRef = useRef<HTMLInputElement>(null);
  const imgBlockRef = useRef<HTMLInputElement>(null);
  const [showChangeType, setShowChangeType] = useState(false);
  const changeTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showChangeType) return;
    const h = (e: MouseEvent) => {
      if (changeTypeRef.current && !changeTypeRef.current.contains(e.target as Node))
        setShowChangeType(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showChangeType]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const cardClass = `bg-white rounded-xl cursor-pointer transition-all duration-150 relative ${
    isSelected ? "ring-2 ring-primary-400" : "hover:ring-2 hover:ring-primary-200"
  }`;

  // ─── Drag handle (inline, left side of card) ───────────────────────────────

  function DragHandle() {
    return (
      <div
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="w-6 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity touch-none self-stretch"
      >
        <DotsNineIcon size={14} weight="bold" />
      </div>
    );
  }

  // ─── Change type dropdown ──────────────────────────────────────────────────

  function ChangeTypeMenu() {
    const similar = SIMILAR_TYPES[field.type] ?? [];
    if (similar.length === 0) return null;
    return (
      <div className="absolute right-full top-0 mr-1 z-[200] bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.13)] border border-gray-100 py-1.5 w-40">
        <p className="px-3 pt-1 pb-1.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Change to</p>
        {similar.map((type) => (
          <button
            key={type}
            onClick={(e) => { e.stopPropagation(); onChange({ type }); setShowChangeType(false); }}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {FIELD_TYPE_LABELS[type] ?? type}
          </button>
        ))}
      </div>
    );
  }

  // ─── Floating action buttons (outside card, right side) ───────────────────

  function FloatingActions() {
    return (
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+36px)] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-50">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); onOpenSettings?.(); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-primary-600 hover:border-primary-200 transition-colors"
          title="Settings"
        >
          <GearSixIcon size={13} />
        </button>
        {(SIMILAR_TYPES[field.type]?.length ?? 0) > 0 && (
          <div className="relative" ref={changeTypeRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowChangeType((v) => !v); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
              title="Change type"
            >
              <ArrowsClockwiseIcon size={13} />
            </button>
            {showChangeType && <ChangeTypeMenu />}
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
          title="Duplicate"
        >
          <CopySimpleIcon size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
          title="Delete"
        >
          <TrashSimpleIcon size={13} />
        </button>
      </div>
    );
  }

  // ─── title_block ────────────────────────────────────────────────────────────

  if (field.type === "title_block") {
    return (
      <div ref={setNodeRef} style={style} {...attributes} className="group relative">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onSelect}
          className={cardClass}
        >
          <div className="flex">
            <DragHandle />
            <div className="flex-1 py-4 pr-5 min-w-0" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <RichInput value={field.label} onChange={(v) => onChange({ label: v })} placeholder="Title" className="text-lg font-semibold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-primary-400 pb-1 transition-colors w-full" stopPropagation noLists />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); headerImgRef.current?.click(); }}
                  title="Add image"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:text-primary-500 hover:border-primary-200 hover:bg-primary-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <ImageIcon size={14} />
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
            </div>
          </div>
        </motion.div>
        <FloatingActions />
      </div>
    );
  }

  // ─── image_block ────────────────────────────────────────────────────────────

  if (field.type === "image_block") {
    return (
      <div ref={setNodeRef} style={style} {...attributes} className="group relative">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onSelect}
          className={cardClass}
        >
          <div className="flex">
            <DragHandle />
            <div className="flex-1 py-4 pr-5 min-w-0" onClick={(e) => e.stopPropagation()}>
              {field.headerImage ? (
                <ResizableImage src={field.headerImage} imgRef={imgBlockRef} imageWidth={field.imageWidth} imageAlign={field.imageAlign} imageCaption={field.imageCaption} onUpdate={onChange} onRemove={() => onChange({ headerImage: undefined, imageCaption: undefined })} />
              ) : (
                <button onClick={(e) => { e.stopPropagation(); imgBlockRef.current?.click(); }} className="w-full h-28 border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:text-gray-500 transition-colors">
                  <ImageIcon size={20} />
                  <span className="text-sm">Click to add image</span>
                </button>
              )}
              <input ref={imgBlockRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange({ headerImage: URL.createObjectURL(f), ...(field.headerImage ? {} : { imageWidth: 100, imageAlign: "left" as const }) }); e.target.value = ""; }} />
            </div>
          </div>
        </motion.div>
        <FloatingActions />
      </div>
    );
  }

  // ─── banner_block ───────────────────────────────────────────────────────────

  if (field.type === "banner_block") {
    return (
      <div ref={setNodeRef} style={style} {...attributes} className="group relative">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onSelect}
          className={`cursor-pointer transition-all duration-150 ${isSelected ? "ring-2 ring-primary-400 ring-offset-1 rounded-lg" : ""}`}
        >
          {(() => {
            const bc = BANNER_COLORS[field.bannerType ?? 'info']
            return (
              <div className={`${bc.bg} border ${bc.border} rounded-lg px-4 py-3 flex items-start gap-3`}>
                <InfoIcon size={16} weight="fill" className={`mt-0.5 ${bc.icon} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <input
                    value={field.label}
                    onChange={(e) => { e.stopPropagation(); onChange({ label: e.target.value }); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Banner title"
                    className={`${bc.text} font-semibold text-sm w-full bg-transparent outline-none placeholder:opacity-40`}
                  />
                  <input
                    value={field.description ?? ''}
                    onChange={(e) => { e.stopPropagation(); onChange({ description: e.target.value }); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Description (optional)"
                    className={`${bc.sub} text-xs w-full bg-transparent outline-none placeholder:opacity-30 mt-0.5`}
                  />
                </div>
                <div {...listeners} className={`${bc.icon} opacity-30 cursor-grab active:cursor-grabbing group-hover:opacity-100 transition-opacity touch-none shrink-0`}>
                  <DotsNineIcon size={16} weight="bold" />
                </div>
              </div>
            )
          })()}
        </motion.div>
        <FloatingActions />
      </div>
    );
  }

  // ─── All other question types ───────────────────────────────────────────────

  const hasOptions = ["multiple_choice", "checkbox"].includes(field.type);

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="group relative">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.12 }}
        onClick={onSelect}
        className={`${cardClass}${isSelected ? " z-40" : ""}`}
      >
        <div className="flex">
          <DragHandle />
          <div className="flex-1 py-4 pr-5 min-w-0">
            <div onClick={(e) => e.stopPropagation()}>
              {/* Label */}
              <div className="mb-3">
                <RichInput
                  value={field.label}
                  onChange={(v) => onChange({ label: v })}
                  placeholder="Type your question here"
                  className="text-sm font-medium border-b-2 border-transparent hover:border-gray-200 focus:border-primary-500 pb-1 transition-colors w-full text-gray-900"
                  stopPropagation
                  noLists
                />
              </div>

              {/* Field preview */}
              {field.type === "short_text" && <ShortTextField placeholder={field.placeholder} defaultValue={field.defaultValue} onChange={(v) => onChange({ placeholder: v })} />}
              {field.type === "paragraph" && <ParagraphField placeholder={field.placeholder} defaultValue={field.defaultValue} onChange={(v) => onChange({ placeholder: v })} />}
              {field.type === "date" && <DateField />}
              {field.type === "time" && <TimeField />}
              {field.type === "email" && <EmailField placeholder={field.placeholder} defaultValue={field.defaultValue} onChange={(v) => onChange({ placeholder: v })} />}
              {field.type === "file_upload" && (
                <FileUploadField
                  allowedFileTypes={field.allowedFileTypes}
                  maxFileCount={field.maxFileCount}
                  maxFileSizeMb={field.maxFileSizeMb}
                  onChange={onChange}
                />
              )}
              {field.type === "rating" && (
                <RatingSection
                  scaleMax={field.scaleMax}
                  ratingIcon={field.ratingIcon}
                  minLabel={field.minLabel}
                  maxLabel={field.maxLabel}
                  isSelected={isSelected}
                  onChange={onChange}
                />
              )}
              {field.type === "linear_scale" && (
                <LinearScaleField
                  scaleMin={field.scaleMin}
                  scaleMax={field.scaleMax}
                  minLabel={field.minLabel}
                  maxLabel={field.maxLabel}
                  onChange={onChange}
                />
              )}

              {/* Multiple choice / Checkbox — bordered pill options */}
              {hasOptions && (
                <div className="space-y-2 pointer-events-none select-none">
                  {(field.options?.length ? field.options : ['Option 1', 'Option 2']).slice(0, 4).map((opt, i) => (
                    <div key={i} className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-2.5 bg-white">
                      {field.type === 'multiple_choice' && <span className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />}
                      {field.type === 'checkbox' && <span className="w-4 h-4 rounded border-2 border-gray-300 shrink-0" />}
                      <span className="text-sm text-gray-500">{opt}</span>
                    </div>
                  ))}
                  {(field.options?.length ?? 2) > 4 && (
                    <p className="text-xs text-gray-400 pl-4">+{(field.options?.length ?? 2) - 4} more</p>
                  )}
                </div>
              )}

              {/* Dropdown — single select with chevron */}
              {field.type === 'dropdown' && (
                <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2.5 bg-white pointer-events-none select-none">
                  <span className="flex-1 text-sm text-gray-300">Select an option</span>
                  <CaretDownIcon size={14} className="text-gray-400 shrink-0" />
                </div>
              )}

              {/* Phone — flag + chevron + input */}
              {field.type === "phone" && (
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="flex items-center gap-1 px-3 py-2.5 bg-gray-50 border-r border-gray-100 shrink-0">
                    <span className="text-base leading-none">🇺🇸</span>
                    <CaretDownIcon size={10} className="text-gray-400" />
                  </div>
                  <input type="tel" disabled
                    value={field.defaultValue ?? ''}
                    placeholder={field.defaultValue ? '' : (field.placeholder ?? '')}
                    className={`flex-1 px-3 py-2.5 text-sm bg-white outline-none cursor-default ${field.defaultValue ? 'text-gray-600' : 'text-gray-300 placeholder:text-gray-300'}`} />
                </div>
              )}

              {/* Address — multi-field layout */}
              {field.type === "address" && (
                <div className="space-y-2 pointer-events-none select-none">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-white">
                    <MapPinIcon size={14} className="text-gray-300 shrink-0" />
                    <span className={`text-sm ${field.addressSubDefaults?.street ? 'text-gray-600' : 'text-gray-300'}`}>
                      {field.addressSubDefaults?.street ?? field.addressSubPlaceholders?.street ?? 'Address'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border border-gray-200 rounded-lg px-3 py-2 bg-white">
                      <span className={`text-sm ${field.addressSubDefaults?.city ? 'text-gray-600' : 'text-gray-300'}`}>
                        {field.addressSubDefaults?.city ?? field.addressSubPlaceholders?.city ?? 'City'}
                      </span>
                    </div>
                    <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-white gap-1">
                      <span className={`text-sm flex-1 truncate ${field.addressSubDefaults?.state ? 'text-gray-600' : 'text-gray-300'}`}>
                        {field.addressSubDefaults?.state ?? field.addressSubPlaceholders?.state ?? 'State / Province'}
                      </span>
                      <CaretDownIcon size={11} className="text-gray-300 shrink-0" />
                    </div>
                    <div className="border border-gray-200 rounded-lg px-3 py-2 bg-white">
                      <span className={`text-xs ${field.addressSubDefaults?.zip ? 'text-gray-600' : 'text-gray-300'}`}>
                        {field.addressSubDefaults?.zip ?? field.addressSubPlaceholders?.zip ?? 'ZIP / Postal code'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {field.type === "number" && (
                <input type="number" disabled
                  value={field.defaultValue ?? ''}
                  placeholder={field.defaultValue ? '' : (field.placeholder ?? '')}
                  className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white cursor-default outline-none ${field.defaultValue ? 'text-gray-600' : 'text-gray-300 placeholder:text-gray-300'}`} />
              )}
              {field.type === "currency" && (
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <span className="px-3 py-2.5 text-sm text-gray-400 border-r border-gray-100 bg-gray-50">$</span>
                  <input type="number" disabled
                    value={field.defaultValue ?? ''}
                    placeholder={field.defaultValue ? '' : '0.00'}
                    className={`flex-1 px-3 py-2.5 text-sm bg-white cursor-default outline-none ${field.defaultValue ? 'text-gray-600' : 'text-gray-300 placeholder:text-gray-300'}`} />
                </div>
              )}
              {field.type === "rich_text" && (
                <textarea disabled placeholder={field.placeholder ?? ''} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-300 bg-white cursor-default resize-none outline-none placeholder:text-gray-300" />
              )}
              {field.type === "ranking" && (
                <div className="space-y-1.5 pointer-events-none select-none">
                  {(field.options?.length ? field.options : ["Option 1", "Option 2", "Option 3"]).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white">
                      <span className="text-gray-300 text-xs font-bold w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 text-sm text-gray-500">{opt}</div>
                      <span className="text-gray-300">
                        <DotsNineIcon size={14} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {field.type === "opinion_scale" && (
                <div className="flex gap-1.5 pointer-events-none select-none">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 bg-white text-center font-medium">
                      {n}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      <FloatingActions />
    </div>
  );
}
