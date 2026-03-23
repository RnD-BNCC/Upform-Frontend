import { useState, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDownIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import type { FormField } from "@/types/form";

const FILE_TYPE_OPTIONS = [
  "Document",
  "PDF",
  "Spreadsheet",
  "Presentation",
  "Drawing",
  "Image",
  "Video",
  "Audio",
] as const;

const FILE_COUNT_OPTIONS = [1, 2, 3, 4, 5, 10];

const FILE_SIZE_OPTIONS = [
  { label: "1 MB", value: 1 },
  { label: "10 MB", value: 10 },
  { label: "100 MB", value: 100 },
  { label: "1 GB", value: 1024 },
] as const;

type Props = {
  allowedFileTypes?: string[];
  maxFileCount?: number;
  maxFileSizeMb?: number;
  isSelected: boolean;
  onChange: (updates: Partial<FormField>) => void;
};

export default memo(function FileUploadField({
  allowedFileTypes,
  maxFileCount,
  maxFileSizeMb,
  isSelected,
  onChange,
}: Props) {
  const [countOpen, setCountOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const countRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);

  const restrictTypes = !!allowedFileTypes;
  const count = maxFileCount ?? 1;
  const sizeMb = maxFileSizeMb ?? 10;
  const sizeLabel =
    FILE_SIZE_OPTIONS.find((s) => s.value === sizeMb)?.label ?? `${sizeMb} MB`;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countRef.current && !countRef.current.contains(e.target as Node))
        setCountOpen(false);
      if (sizeRef.current && !sizeRef.current.contains(e.target as Node))
        setSizeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div>
      <div>
        <p className="text-[11px] italic mb-3 text-gray-400">
          Upload maks {count} file. Maks {sizeLabel} per file.
          {restrictTypes && allowedFileTypes!.length > 0 && (
            <span> ({allowedFileTypes!.join(", ")})</span>
          )}
        </p>
        <span className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 rounded-md px-3 py-1.5 text-sm">
          <UploadSimpleIcon size={15} />
          Tambahkan file
        </span>
      </div>

      <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">
              Izinkan hanya jenis file tertentu
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange({ allowedFileTypes: restrictTypes ? undefined : [] });
              }}
              className={`relative w-9 h-5 rounded-full transition-colors duration-150 shrink-0 cursor-pointer ${
                restrictTypes ? "bg-primary-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
                  restrictTypes ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <AnimatePresence>
            {restrictTypes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-2 gap-x-6 gap-y-1.5 overflow-hidden"
              >
                {FILE_TYPE_OPTIONS.map((type) => {
                  const selected = allowedFileTypes!.includes(type);
                  return (
                    <label
                      key={type}
                      className="flex items-center gap-2.5 cursor-pointer py-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          onChange({
                            allowedFileTypes: selected
                              ? allowedFileTypes!.filter((t) => t !== type)
                              : [...allowedFileTypes!, type],
                          });
                        }}
                        className="accent-primary-500 w-3.5 h-3.5 shrink-0 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Jumlah maksimum file
              </span>
              <div ref={countRef} className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCountOpen((v) => !v);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 border border-gray-200 hover:border-gray-300 rounded-lg text-sm bg-white transition-colors cursor-pointer"
                >
                  {count}
                  <CaretDownIcon
                    size={12}
                    className={`text-gray-400 transition-transform duration-150 ${countOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {countOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 4 }}
                      transition={{ duration: 0.1 }}
                      className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 min-w-15"
                    >
                      {FILE_COUNT_OPTIONS.map((n) => (
                        <button
                          key={n}
                          onClick={(e) => {
                            e.stopPropagation();
                            onChange({ maxFileCount: n });
                            setCountOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-sm text-left transition-colors cursor-pointer ${
                            count === n
                              ? "text-primary-600 bg-primary-50 font-medium"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Ukuran file maksimal</span>
              <div ref={sizeRef} className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSizeOpen((v) => !v);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 border border-gray-200 hover:border-gray-300 rounded-lg text-sm bg-white transition-colors cursor-pointer"
                >
                  {sizeLabel}
                  <CaretDownIcon
                    size={12}
                    className={`text-gray-400 transition-transform duration-150 ${sizeOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {sizeOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 4 }}
                      transition={{ duration: 0.1 }}
                      className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 min-w-22.5"
                    >
                      {FILE_SIZE_OPTIONS.map(({ label, value }) => (
                        <button
                          key={value}
                          onClick={(e) => {
                            e.stopPropagation();
                            onChange({ maxFileSizeMb: value });
                            setSizeOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-sm text-left transition-colors cursor-pointer ${
                            sizeMb === value
                              ? "text-primary-600 bg-primary-50 font-medium"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
});

