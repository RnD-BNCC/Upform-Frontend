import { useEffect, useMemo, useRef, useState } from "react";
import {
  CaretDownIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@phosphor-icons/react";
import { FILE_TYPE_OPTIONS } from "@/utils/form/fileTypes";

type Props = {
  selected: string[];
  onChange: (types: string[]) => void;
};

export default function FileTypeMultiSelect({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const selectedItems = useMemo(
    () => FILE_TYPE_OPTIONS.filter((option) => selected.includes(option.value)),
    [selected],
  );

  const availableItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return FILE_TYPE_OPTIONS.filter((option) => {
      if (selected.includes(option.value)) return false;
      if (!query) return true;
      return option.label.toLowerCase().includes(query);
    });
  }, [search, selected]);

  const removeType = (value: string) => {
    onChange(selected.filter((selectedValue) => selectedValue !== value));
  };

  const addType = (value: string) => {
    onChange([...selected, value]);
    setSearch("");
  };

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen((current) => !current)}
        className="mt-1 flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 transition-colors hover:border-gray-300"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeType(item.value);
                }}
                className="inline-flex max-w-full items-center gap-1 rounded bg-primary-500 px-2 py-1 text-[10px] font-medium text-white"
              >
                <span className="max-w-28 truncate">{item.label}</span>
                <XIcon size={10} weight="bold" className="shrink-0" />
              </button>
            ))
          ) : (
            <span className="text-xs text-gray-400">All file types allowed</span>
          )}
        </div>
        {selectedItems.length > 0 && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange([]);
              }}
              className="shrink-0 text-gray-300 transition-colors hover:text-gray-500"
            >
              <XIcon size={12} />
            </button>
            <span className="h-4 w-px shrink-0 bg-gray-200" />
          </>
        )}
        <CaretDownIcon
          size={12}
          className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <div className="flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5 focus-within:border-primary-300">
              <MagnifyingGlassIcon size={12} className="shrink-0 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search file types..."
                className="w-full bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto py-1">
            {availableItems.length > 0 ? (
              availableItems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => addType(item.value)}
                  className="mx-1 my-0.5 block w-[calc(100%-0.5rem)] rounded-md px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {item.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-gray-400">
                No file types found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
