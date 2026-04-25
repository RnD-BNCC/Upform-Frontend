import { useState } from "react";
import { ImageIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { ImagePickerModal } from "@/components/modal";
import HelpTooltip from "../shared/HelpTooltip";

type Props = {
  startText: string;
  onStartTextChange: (t: string) => void;
  coverImage?: string | null;
  onAddImage?: (url: string) => void;
  onRemoveImage?: () => void;
  coverLayout?: number;
  onLayoutChange?: (i: number) => void;
};

function CoverLayoutThumbnail({
  active,
  layout,
}: {
  active: boolean;
  layout: number;
}) {
  if (layout === 1) {
    return (
      <div className="flex h-full w-full overflow-hidden rounded-[3px]">
        <span className="h-full w-[28%] bg-slate-300" />
        <span className="flex flex-1 items-center justify-center bg-slate-100">
          <span className="h-7 w-8 rounded-sm bg-slate-200" />
        </span>
      </div>
    );
  }

  if (layout === 2) {
    return (
      <div className="flex h-full w-full overflow-hidden rounded-[3px]">
        <span className="flex flex-1 items-center justify-center bg-slate-50">
          <span className="h-7 w-8 rounded-sm bg-slate-200" />
        </span>
        <span className="h-full w-[28%] bg-slate-300" />
      </div>
    );
  }

  if (layout === 3) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center rounded-[3px] ${
          active ? "bg-blue-100" : "bg-slate-100"
        }`}
      >
        <ImageIcon
          size={28}
          weight="fill"
          className={active ? "text-blue-400" : "text-slate-300"}
        />
      </div>
    );
  }

  return <div className="h-full w-full rounded-[3px] bg-slate-200" />;
}

export default function CoverSettingsPanel({
  startText,
  onStartTextChange,
  coverImage,
  onAddImage,
  onRemoveImage,
  coverLayout = 0,
  onLayoutChange,
}: Props) {
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  return (
    <div className="w-72 shrink-0 bg-gray-50 border-r border  z-10 flex flex-col overflow-hidden h-full">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">Cover Settings</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Button text
          </label>
          <input
            type="text"
            value={startText}
            onChange={(e) => onStartTextChange(e.target.value)}
            placeholder="Start"
            className="w-full border bg-white border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400"
          />
        </div>

        {/* Image above title */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Image above title
          </label>
          {coverImage ? (
            <div className="relative group rounded-lg overflow-hidden border border-gray-200">
              <img
                src={coverImage}
                alt="Cover"
                className="w-full h-20 object-cover"
              />
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemoveImage?.();
                }}
                className="absolute top-1 right-1 z-10 w-6 h-6 bg-black/50 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"
              >
                <TrashIcon size={11} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsImagePickerOpen(true);
                }}
                className="absolute inset-0 z-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100 text-white text-xs font-semibold"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsImagePickerOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <ImageIcon size={13} />
              Add image
            </button>
          )}
        </div>

        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-900">
            Custom cover page layout
            <HelpTooltip>Choose how the cover page looks</HelpTooltip>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((layout) => {
              const active = coverLayout === layout;
              return (
                <button
                  key={layout}
                  type="button"
                  onClick={() => onLayoutChange?.(layout)}
                  className={`flex h-11 min-w-0 items-center justify-center overflow-hidden rounded border p-1 transition-colors ${
                    active
                      ? "border-primary-500 bg-blue-50 ring-2 ring-primary-200"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                  }`}
                  aria-label={`Cover layout ${layout + 1}`}
                >
                  <CoverLayoutThumbnail active={active} layout={layout} />
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onLayoutChange?.(0)}
            disabled={coverLayout === 0}
            className="mx-auto mt-3 flex items-center gap-1.5 text-xs font-semibold text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-gray-400"
          >
            <XIcon size={14} weight="bold" />
            <span className="underline underline-offset-2">Reset layout</span>
          </button>
        </div>
      </div>
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        showIconTab={false}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={(url) => onAddImage?.(url)}
      />
    </div>
  );
}
