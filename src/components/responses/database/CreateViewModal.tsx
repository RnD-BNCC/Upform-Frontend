import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@phosphor-icons/react";

type CreateViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
};

export default function CreateViewModal({
  isOpen,
  onClose,
  onCreate,
}: CreateViewModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const trimmedName = name.trim();

  useEffect(() => {
    if (!isOpen) return;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4 text-gray-950"
      onClick={onClose}
    >
      <form
        className="w-full max-w-[400px] overflow-hidden rounded-sm border border-gray-100/80 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (!trimmedName) return;
          onCreate(trimmedName);
          onClose();
        }}
      >
        <div className="flex h-12 items-center justify-between border-b border-gray-100 px-4">
          <h2 className="text-sm font-bold">Create View</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close create view modal"
          >
            <XIcon size={14} />
          </button>
        </div>

        <div className="space-y-2 px-4 py-3">
          <label
            htmlFor="create-result-view-name"
            className="block text-xs font-medium text-gray-600"
          >
            View Name
          </label>
          <input
            ref={inputRef}
            id="create-result-view-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter view name"
            className="h-9 w-full rounded-sm border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400"
          />
        </div>

        <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-4 py-3">
          <button
            type="submit"
            disabled={!trimmedName}
            className="h-8 rounded-sm bg-gray-900 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Create View
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
