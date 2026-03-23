import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadSimpleIcon,
  XIcon,
  StarIcon,
  HeartIcon,
  ThumbsUpIcon,
  SpinnerGapIcon,
  FileIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";
import { useMutationUploadFile } from "@/api/upload/queries";
import type { FormField } from "@/types/form";

const FILE_TYPE_MIME_MAP: Record<string, string[]> = {
  Document: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/rtf",
  ],
  PDF: ["application/pdf"],
  Spreadsheet: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ],
  Presentation: [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  Drawing: ["image/svg+xml", "application/x-drawio"],
  Image: ["image/"],
  Video: ["video/"],
  Audio: ["audio/"],
};

function isFileTypeAllowed(file: File, allowedTypes?: string[]): boolean {
  if (!allowedTypes || allowedTypes.length === 0) return true;
  const mime = file.type.toLowerCase();
  return allowedTypes.some((type) => {
    const mimes = FILE_TYPE_MIME_MAP[type];
    if (!mimes) return false;
    return mimes.some((m) => (m.endsWith("/") ? mime.startsWith(m) : mime === m));
  });
}

function parseFileValue(v: string): { name: string; url: string } {
  const sep = v.indexOf("::");
  if (sep === -1) return { name: v, url: "" };
  return { name: v.slice(0, sep), url: v.slice(sep + 2) };
}

const shakeVariants = {
  shake: {
    opacity: 1,
    y: 0,
    x: [0, -6, 6, -6, 6, -3, 3, 0],
    transition: { duration: 0.4 },
  },
  idle: { opacity: 1, y: 0, x: 0 },
};

const inputBase = (hasError: boolean) =>
  `w-full border-b pb-1 text-sm outline-none bg-transparent transition-colors ${
    hasError
      ? "border-red-400 focus:border-red-500"
      : "border-transparent hover:border-gray-300 focus:border-primary-500"
  }`;

function DropdownSelect({
  options,
  value,
  optionImages,
  optionImageWidths,
  hasError,
  onSelect,
}: {
  options: string[];
  value: string;
  optionImages?: Record<string, string>;
  optionImageWidths?: Record<string, number>;
  hasError: boolean;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between border text-sm px-3 py-2 rounded transition-colors bg-white cursor-pointer ${
          hasError ? "border-red-400" : open ? "border-primary-500" : "border-gray-300"
        }`}
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value || "Choose an option"}
        </span>
        <CaretDownIcon
          size={14}
          className={`text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full mt-1 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 max-h-60 overflow-y-auto"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onSelect(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                  value === opt ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{opt}</span>
                {optionImages?.[opt] && (
                  <div className="mt-1.5 inline-block" style={optionImageWidths?.[opt] ? { width: `${optionImageWidths[opt]}%` } : undefined}>
                    <img
                      src={optionImages[opt]}
                      className={`rounded-md object-contain border border-gray-100 ${optionImageWidths?.[opt] ? 'w-full' : 'max-h-36 max-w-full'}`}
                      alt={opt}
                    />
                  </div>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type Props = {
  field: FormField;
  value?: string | string[];
  otherText?: string;
  hasError: boolean;
  errorMessage?: string;
  isShaking: boolean;
  onAnswer: (value: string | string[]) => void;
  onOtherTextChange: (text: string) => void;
  onAnimationComplete: () => void;
  setRef: (el: HTMLDivElement | null) => void;
  pendingFilesRef?: React.RefObject<Record<string, File[]>>;
};

export default function PreviewField({
  field,
  value,
  otherText = "",
  hasError,
  errorMessage,
  isShaking,
  onAnswer,
  onOtherTextChange,
  onAnimationComplete,
  setRef,
  pendingFilesRef,
}: Props) {
  if (field.type === "title_block") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 pt-5 pb-4">
        {field.headerImage && (
          <img
            src={field.headerImage}
            className="w-full max-h-40 object-cover rounded-lg mb-4"
            alt=""
          />
        )}
        {field.label && (
          <h3
            className="text-lg font-semibold text-gray-900 leading-snug [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:leading-normal"
            dangerouslySetInnerHTML={{ __html: field.label }}
          />
        )}
        {field.description && (
          <div
            className="text-sm text-gray-900 mt-1.5 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:leading-normal"
            dangerouslySetInnerHTML={{ __html: field.description }}
          />
        )}
      </div>
    );
  }

  if (field.type === "image_block") {
    if (!field.headerImage) return null;
    return (
      <div
        className={`${
          field.imageAlign === "center"
            ? "flex justify-center"
            : field.imageAlign === "right"
              ? "flex justify-end"
              : ""
        }`}
      >
        <div style={{ width: `${field.imageWidth ?? 100}%` }}>
          <img
            src={field.headerImage}
            className="w-full rounded-lg object-cover"
            alt=""
          />
          {field.imageCaption && (
            <p className="text-xs text-gray-500 text-center mt-1">
              {field.imageCaption}
            </p>
          )}
        </div>
      </div>
    );
  }

  const val = value;
  const rating = parseInt((val as string) || "0");

  return (
    <motion.div
      ref={setRef}
      variants={shakeVariants}
      animate={isShaking ? "shake" : "idle"}
      onAnimationComplete={onAnimationComplete}
      initial={{ opacity: 0, y: 8 }}
      className={`bg-white rounded-lg border shadow-sm p-5 sm:p-6 transition-colors ${
        hasError ? "border-red-300" : "border-gray-200"
      }`}
    >
      <p className="text-[15px] font-medium text-gray-900 mb-1 leading-snug">
        <span dangerouslySetInnerHTML={{ __html: field.label || "Untitled Question" }} />
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </p>

      {field.description && (
        <div
          className="text-sm text-gray-900 mb-3 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:leading-normal"
          dangerouslySetInnerHTML={{ __html: field.description }}
        />
      )}

      {field.headerImage && (
        <div
          className={`mt-2 mb-3 ${
            field.imageAlign === "center"
              ? "flex justify-center"
              : field.imageAlign === "right"
                ? "flex justify-end"
                : ""
          }`}
        >
          <div style={{ width: `${field.imageWidth ?? 100}%` }}>
            <img
              src={field.headerImage}
              className="w-full rounded-lg object-cover"
              alt=""
            />
            {field.imageCaption && (
              <p className="text-xs text-gray-500 text-center mt-1">
                {field.imageCaption}
              </p>
            )}
          </div>
        </div>
      )}

      {field.type === "short_text" && (
        <input
          type="text"
          value={(val as string) ?? ""}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={field.placeholder || "Your answer"}
          className={inputBase(hasError)}
        />
      )}

      {field.type === "paragraph" && (
        <textarea
          value={(val as string) ?? ""}
          onChange={(e) => {
            onAnswer(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          placeholder={field.placeholder || "Your answer"}
          rows={Math.max(3, (field.placeholder?.split('\n').length ?? 0) + 1)}
          className={`${inputBase(hasError)} resize-none overflow-hidden`}
        />
      )}

      {field.type === "date" && (
        <input
          type="date"
          value={(val as string) ?? ""}
          onChange={(e) => onAnswer(e.target.value)}
          className={`w-full max-w-xs border rounded-md text-sm px-3 py-2 outline-none transition-colors bg-white ${
            hasError
              ? "border-red-400 focus:border-red-500"
              : "border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
          }`}
        />
      )}

      {field.type === "time" && (
        <input
          type="time"
          value={(val as string) ?? ""}
          onChange={(e) => onAnswer(e.target.value)}
          className={`w-full max-w-xs border rounded-md text-sm px-3 py-2 outline-none transition-colors bg-white ${
            hasError
              ? "border-red-400 focus:border-red-500"
              : "border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
          }`}
        />
      )}

      {field.type === "rating" &&
        (() => {
          const ICON_MAP = {
            star: { Icon: StarIcon, selectedClass: "text-yellow-400" },
            heart: { Icon: HeartIcon, selectedClass: "text-red-400" },
            thumb: { Icon: ThumbsUpIcon, selectedClass: "text-primary-500" },
          } as const;
          const min = field.scaleMin ?? 1;
          const max = field.scaleMax ?? 5;
          const iconKey = (field.ratingIcon ?? "star") as keyof typeof ICON_MAP;
          const { Icon, selectedClass } = ICON_MAP[iconKey];
          const cols = Array.from({ length: max - min + 1 }, (_, i) => min + i);
          return (
            <>
              <div className="md:hidden mt-2">
                {field.minLabel && (
                  <p className="text-sm text-gray-700 mb-3">{field.minLabel}</p>
                )}
                <div className="space-y-0.5">
                  {cols.map((n) => {
                    const isSelected = n <= rating;
                    return (
                      <button
                        key={n}
                        onClick={() => onAnswer(String(n))}
                        className="flex items-center gap-4 w-full py-1.5 cursor-pointer"
                      >
                        <span className="text-sm text-gray-600 w-5 text-right shrink-0">{n}</span>
                        <Icon
                          size={26}
                          weight={isSelected ? "fill" : "regular"}
                          className={`transition-colors ${isSelected ? selectedClass : "text-gray-300"}`}
                        />
                      </button>
                    );
                  })}
                </div>
                {field.maxLabel && (
                  <p className="text-sm text-gray-700 mt-3">{field.maxLabel}</p>
                )}
              </div>
              <div className="hidden md:flex items-end gap-6 mt-2">
                {field.minLabel && (
                  <span className="text-sm text-gray-700 shrink-0 pb-1.5">{field.minLabel}</span>
                )}
                <div className="flex flex-1 justify-between overflow-x-auto">
                  {cols.map((n) => {
                    const isSelected = n <= rating;
                    return (
                      <button
                        key={n}
                        onClick={() => onAnswer(String(n))}
                        className="flex flex-col items-center gap-1 p-1.5 cursor-pointer group"
                      >
                        <Icon
                          size={28}
                          weight={isSelected ? "fill" : "regular"}
                          className={`transition-colors ${isSelected ? selectedClass : "text-gray-300 group-hover:text-gray-400"}`}
                        />
                        <span className="text-xs text-gray-500">{n}</span>
                      </button>
                    );
                  })}
                </div>
                {field.maxLabel && (
                  <span className="text-sm text-gray-700 shrink-0 pb-1.5">{field.maxLabel}</span>
                )}
              </div>
              {val && (
                <button
                  onClick={() => onAnswer("")}
                  className="text-xs text-gray-400 hover:text-gray-600 mt-2 block ml-auto transition-colors cursor-pointer"
                >
                  Batalkan pilihan
                </button>
              )}
            </>
          );
        })()}

      {field.type === "linear_scale" &&
        (() => {
          const min = field.scaleMin ?? 1;
          const max = field.scaleMax ?? 5;
          const cols = Array.from({ length: max - min + 1 }, (_, i) => min + i);
          return (
            <>
              <div className="md:hidden mt-2">
                {field.minLabel && (
                  <p className="text-sm text-gray-700 mb-3">{field.minLabel}</p>
                )}
                <div className="space-y-0.5">
                  {cols.map((n) => (
                    <button
                      key={n}
                      onClick={() => onAnswer(String(n))}
                      className="flex items-center gap-4 w-full py-1.5 cursor-pointer"
                    >
                      <span className="text-sm text-gray-600 w-5 text-right shrink-0">{n}</span>
                      <div
                        className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
                          rating === n
                            ? "border-primary-500 bg-primary-500"
                            : "border-gray-400 hover:border-primary-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {field.maxLabel && (
                  <p className="text-sm text-gray-700 mt-3">{field.maxLabel}</p>
                )}
              </div>
              <div className="hidden md:flex items-end gap-6 mt-2">
                {field.minLabel && (
                  <span className="text-sm text-gray-700 shrink-0 pb-1.5">{field.minLabel}</span>
                )}
                <div className="flex flex-1 justify-between overflow-x-auto">
                  {cols.map((n) => (
                    <button
                      key={n}
                      onClick={() => onAnswer(String(n))}
                      className="flex flex-col items-center gap-1 p-1.5 cursor-pointer group"
                    >
                      <span className="text-xs text-gray-500">{n}</span>
                      <div
                        className={`w-4 h-4 rounded-full border-2 transition-colors ${
                          rating === n
                            ? "border-primary-500 bg-primary-500"
                            : "border-gray-400 group-hover:border-primary-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {field.maxLabel && (
                  <span className="text-sm text-gray-700 shrink-0 pb-1.5">{field.maxLabel}</span>
                )}
              </div>
              {val && (
                <button
                  onClick={() => onAnswer("")}
                  className="text-xs text-gray-400 hover:text-gray-600 mt-2 block ml-auto transition-colors cursor-pointer"
                >
                  Batalkan pilihan
                </button>
              )}
            </>
          );
        })()}

      {field.type === "multiple_choice" && (
        <div className="space-y-2.5 mt-1">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="flex items-start gap-3 cursor-pointer group/opt">
              <input
                type="radio"
                name={field.id}
                value={opt}
                checked={val === opt}
                onChange={() => onAnswer(opt)}
                className="accent-primary-500 w-4 h-4 shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[15px] text-gray-800">{opt}</span>
                {field.optionImages?.[opt] && (
                  <div className="mt-1.5 inline-block" style={field.optionImageWidths?.[opt] ? { width: `${field.optionImageWidths[opt]}%` } : undefined}>
                    <img
                      src={field.optionImages[opt]}
                      className={`rounded-md object-contain border border-gray-100 ${field.optionImageWidths?.[opt] ? 'w-full' : 'max-h-36 max-w-xs'}`}
                      alt={opt}
                    />
                  </div>
                )}
              </div>
            </label>
          ))}

          {field.hasOtherOption && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value="__other__"
                checked={typeof val === "string" && val.startsWith("__other__")}
                onChange={() => onAnswer(`__other__:${otherText}`)}
                className="accent-primary-500 w-4 h-4 shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[15px] text-gray-800">Other:</span>
                <input
                  type="text"
                  value={otherText}
                  onChange={(e) => {
                    const text = e.target.value;
                    onOtherTextChange(text);
                    onAnswer(`__other__:${text}`);
                  }}
                  onFocus={() => onAnswer(`__other__:${otherText}`)}
                  placeholder="Your answer"
                  className="mt-0.5 w-full border-b border-transparent hover:border-gray-300 focus:border-primary-500 text-sm outline-none pb-0.5 bg-transparent transition-colors"
                />
              </div>
            </label>
          )}

          {val && (
            <button
              onClick={() => onAnswer("")}
              className="text-xs text-gray-400 hover:text-gray-600 mt-1 block ml-auto transition-colors cursor-pointer"
            >
              Batalkan pilihan
            </button>
          )}
        </div>
      )}

      {field.type === "checkbox" && (
        <div className="space-y-2.5 mt-1">
          {(field.options ?? []).map((opt) => {
            const checked = Array.isArray(val) && val.includes(opt);
            return (
              <label key={opt} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const prev = Array.isArray(val) ? val : [];
                    onAnswer(checked ? prev.filter((v) => v !== opt) : [...prev, opt]);
                  }}
                  className="accent-primary-500 w-4 h-4 shrink-0 rounded mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[15px] text-gray-800">{opt}</span>
                  {field.optionImages?.[opt] && (
                    <div className="mt-1.5 inline-block" style={field.optionImageWidths?.[opt] ? { width: `${field.optionImageWidths[opt]}%` } : undefined}>
                      <img
                        src={field.optionImages[opt]}
                        className={`rounded-md object-contain border border-gray-100 ${field.optionImageWidths?.[opt] ? 'w-full' : 'max-h-36 max-w-xs'}`}
                        alt={opt}
                      />
                    </div>
                  )}
                </div>
              </label>
            );
          })}

          {field.hasOtherOption && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Array.isArray(val) && val.some((v) => v.startsWith("__other__"))}
                onChange={() => {
                  const prev = Array.isArray(val) ? val : [];
                  const hasOther = prev.some((v) => v.startsWith("__other__"));
                  onAnswer(
                    hasOther
                      ? prev.filter((v) => !v.startsWith("__other__"))
                      : [...prev, `__other__:${otherText}`],
                  );
                }}
                className="accent-primary-500 w-4 h-4 shrink-0 rounded mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[15px] text-gray-800">Other:</span>
                <input
                  type="text"
                  value={otherText}
                  onChange={(e) => {
                    const text = e.target.value;
                    onOtherTextChange(text);
                    if (Array.isArray(val)) {
                      onAnswer([
                        ...val.filter((v) => !v.startsWith("__other__")),
                        `__other__:${text}`,
                      ]);
                    }
                  }}
                  placeholder="Your answer"
                  className="mt-0.5 w-full border-b border-transparent hover:border-gray-300 focus:border-primary-500 text-sm outline-none pb-0.5 bg-transparent transition-colors"
                />
              </div>
            </label>
          )}
        </div>
      )}

      {field.type === "dropdown" && (
        <DropdownSelect
          options={field.options ?? []}
          value={(val as string) ?? ""}
          optionImages={field.optionImages}
          optionImageWidths={field.optionImageWidths}
          hasError={!!hasError}
          onSelect={onAnswer}
        />
      )}

      {field.type === "email" && (
        <input
          type="email"
          value={(val as string) ?? ""}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={field.placeholder || "email@example.com"}
          className={inputBase(hasError)}
        />
      )}

      {field.type === "file_upload" && (
        <FileUploadSection
          field={field}
          value={val}
          hasError={hasError}
          onAnswer={onAnswer}
          pendingFilesRef={pendingFilesRef}
        />
      )}

      {hasError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="mt-2 text-xs text-red-500 font-medium"
        >
          {errorMessage}
        </motion.p>
      )}
    </motion.div>
  );
}

function FileUploadSection({
  field,
  value,
  hasError,
  onAnswer,
  pendingFilesRef,
}: {
  field: FormField;
  value?: string | string[];
  hasError: boolean;
  onAnswer: (value: string | string[]) => void;
  pendingFilesRef?: React.RefObject<Record<string, File[]>>;
}) {
  const deferred = !!pendingFilesRef;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const uploadFile = useMutationUploadFile();

  const maxCount = field.maxFileCount ?? 1;
  const maxSizeMb = field.maxFileSizeMb ?? 10;
  const files: string[] = Array.isArray(value) ? value : value ? [value] : [];
  const canAddMore = files.length < maxCount;

  const acceptTypes = field.allowedFileTypes?.length
    ? field.allowedFileTypes
        .flatMap((type) => {
          const mimes = FILE_TYPE_MIME_MAP[type];
          if (!mimes) return [];
          return mimes.map((m) => (m.endsWith("/") ? m + "*" : m));
        })
        .join(",")
    : undefined;

  const handleFiles = async (selectedFiles: FileList) => {
    setUploadError("");

    const remaining = maxCount - files.length;
    const toUpload = Array.from(selectedFiles).slice(0, remaining);

    for (const file of toUpload) {
      if (!isFileTypeAllowed(file, field.allowedFileTypes)) {
        setUploadError(`"${file.name}" — jenis file tidak diizinkan.`);
        return;
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        setUploadError(`"${file.name}" — ukuran file melebihi ${maxSizeMb} MB.`);
        return;
      }
    }

    if (deferred) {
      const pending = pendingFilesRef.current?.[field.id] ?? [];
      const newPending = [...pending, ...toUpload];
      if (pendingFilesRef.current) pendingFilesRef.current[field.id] = newPending;
      const newFiles = [...files, ...toUpload.map((f) => f.name)];
      onAnswer(maxCount === 1 ? newFiles[0] : newFiles);
      return;
    }

    setUploading(true);
    try {
      const newFiles = [...files];
      for (const file of toUpload) {
        const result = await uploadFile.mutateAsync(file);
        newFiles.push(`${result.filename}::${result.url}`);
      }
      onAnswer(maxCount === 1 ? newFiles[0] : newFiles);
    } catch {
      setUploadError("Gagal mengupload file. Silakan coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    if (deferred && pendingFilesRef.current?.[field.id]) {
      pendingFilesRef.current[field.id] = pendingFilesRef.current[field.id].filter(
        (_, i) => i !== index,
      );
    }
    const newFiles = files.filter((_, i) => i !== index);
    if (newFiles.length === 0) {
      onAnswer("");
    } else {
      onAnswer(maxCount === 1 ? newFiles[0] : newFiles);
    }
  };

  return (
    <div>
      <p className={`text-[11px] italic mb-3 ${hasError ? "text-red-400" : "text-gray-400"}`}>
        Upload maks {maxCount} file. Maks {maxSizeMb} MB per file.
        {field.allowedFileTypes && field.allowedFileTypes.length > 0 && (
          <span> ({field.allowedFileTypes.join(", ")})</span>
        )}
      </p>

      {files.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {files.map((f, i) => {
            const { name } = parseFileValue(f);
            return (
              <div
                key={i}
                className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 border border-gray-100"
              >
                <FileIcon size={16} className="text-gray-400 shrink-0" />
                <span className="truncate flex-1">{name}</span>
                <button
                  onClick={() => removeFile(i)}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
                >
                  <XIcon size={14} weight="bold" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {canAddMore && (
        <label
          className={`inline-flex items-center gap-2 border border-gray-300 hover:border-primary-400 text-gray-700 hover:text-primary-600 rounded-md px-3 py-1.5 text-sm transition-colors ${
            uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"
          }`}
        >
          {uploading ? (
            <SpinnerGapIcon size={15} className="animate-spin" />
          ) : (
            <UploadSimpleIcon size={15} />
          )}
          {uploading ? "Mengupload..." : "Tambahkan file"}
          <input
            type="file"
            className="hidden"
            accept={acceptTypes}
            multiple={maxCount > 1}
            disabled={uploading}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />
        </label>
      )}

      {uploadError && (
        <p className="mt-2 text-xs text-red-500 font-medium">{uploadError}</p>
      )}
    </div>
  );
}
