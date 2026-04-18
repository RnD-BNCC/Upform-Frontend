import { useRef } from "react";
import { ImageIcon, TrashIcon } from "@phosphor-icons/react";

type Props = {
  startText: string;
  onStartTextChange: (t: string) => void;
  coverImage?: string | null;
  onAddImage?: (file: File) => void;
  onRemoveImage?: () => void;
  coverLayout?: number;
  onLayoutChange?: (i: number) => void;
};

const LAYOUT_PREVIEWS = [
  <svg key="0" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="7" width="16" height="2" rx="1" fill="#9ca3af" />
    <rect x="5" y="11" width="10" height="1.5" rx="0.75" fill="#d1d5db" />
    <rect x="6" y="14" width="8" height="2.5" rx="1" fill="#374151" />
  </svg>,
  <svg key="1" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="3" width="7" height="14" rx="1" fill="#e5e7eb" />
    <rect x="11" y="6" width="7" height="2" rx="1" fill="#9ca3af" />
    <rect x="11" y="10" width="5" height="1.5" rx="0.75" fill="#d1d5db" />
    <rect x="11" y="13" width="6" height="2" rx="1" fill="#374151" />
  </svg>,
  <svg key="2" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="11" y="3" width="7" height="14" rx="1" fill="#e5e7eb" />
    <rect x="2" y="6" width="7" height="2" rx="1" fill="#9ca3af" />
    <rect x="2" y="10" width="5" height="1.5" rx="0.75" fill="#d1d5db" />
    <rect x="2" y="13" width="6" height="2" rx="1" fill="#374151" />
  </svg>,
  <svg key="3" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="2" width="16" height="7" rx="1" fill="#e5e7eb" />
    <rect x="4" y="11" width="12" height="2" rx="1" fill="#9ca3af" />
    <rect x="6" y="15" width="8" height="2.5" rx="1" fill="#374151" />
  </svg>,
];

export default function CoverSettingsPanel({
  startText,
  onStartTextChange,
  coverImage,
  onAddImage,
  onRemoveImage,
  coverLayout = 0,
  onLayoutChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-72 shrink-0 bg-white border-r border-gray-100 shadow-[4px_0_16px_rgba(0,0,0,0.07)] z-10 flex flex-col overflow-hidden h-full">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">Cover Settings</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Button text */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Button text
          </label>
          <input
            type="text"
            value={startText}
            onChange={(e) => onStartTextChange(e.target.value)}
            placeholder="Start"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400"
          />
        </div>

        {/* Image above title */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Image above title
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAddImage?.(file);
              e.target.value = "";
            }}
          />
          {coverImage ? (
            <div className="relative group rounded-lg overflow-hidden border border-gray-200">
              <img
                src={coverImage}
                alt="Cover"
                className="w-full h-20 object-cover"
              />
              <button
                onClick={onRemoveImage}
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"
              >
                <TrashIcon size={11} />
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100 text-white text-xs font-semibold"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <ImageIcon size={13} />
              Add image
            </button>
          )}
        </div>

        {/* Cover page layout */}
        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-2">
            Layout
            <span
              className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[9px] font-bold cursor-help"
              title="Choose how the cover page looks"
            >
              ?
            </span>
          </label>
          <div className="flex gap-1.5">
            {LAYOUT_PREVIEWS.map((preview, i) => (
              <button
                key={i}
                onClick={() => onLayoutChange?.(i)}
                className={`w-10 h-10 border rounded-md bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors ${
                  coverLayout === i
                    ? "border-primary-400 ring-1 ring-primary-300"
                    : "border-gray-200"
                }`}
              >
                {preview}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
