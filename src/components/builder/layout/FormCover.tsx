import { useRef } from "react";
import { ImageIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import RichInput from "../utils/RichInput";

const BANNER_COLORS = [
  "#0054a5",
  "#1d4ed8",
  "#7c3aed",
  "#db2777",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
];

type FormCoverProps = {
  bannerColor: string;
  bannerImage: string | null;
  onBannerColorChange: (c: string) => void;
  onBannerImageChange: (url: string | null) => void;
  onBannerFileSelect?: (file: File) => void;
  formTitle: string;
  onTitleChange: (v: string) => void;
  formDescription: string;
  onDescriptionChange: (v: string) => void;
};

export default function FormCover({
  bannerColor,
  bannerImage,
  onBannerColorChange,
  onBannerImageChange,
  onBannerFileSelect,
  formTitle,
  onTitleChange,
  formDescription,
  onDescriptionChange,
}: FormCoverProps) {
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onBannerImageChange(URL.createObjectURL(file));
    onBannerFileSelect?.(file);
  };

  return (
    <>
      {bannerImage && (
        <div
          className={`h-40 mb-10 relative overflow-hidden group transition-[height] duration-200`}
          style={
            bannerImage
              ? {
                  backgroundImage: `url(${bannerImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { backgroundColor: bannerColor }
          }
        >
          {!bannerImage && (
            <>
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
              />
              <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/20" />
            </>
          )}

          <div className="absolute inset-0 bg-black/20 sm:bg-black/0 sm:group-hover:bg-black/30 transition-colors duration-150 flex items-center justify-center gap-3 sm:opacity-0 sm:group-hover:opacity-100">
            {bannerImage && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    bannerInputRef.current?.click();
                  }}
                  className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <ImageIcon size={13} />
                  {bannerImage ? "Change image" : "Upload image"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBannerImageChange(null);
                    if (bannerInputRef.current)
                      bannerInputRef.current.value = "";
                  }}
                  className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <TrashSimpleIcon size={13} />
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div
          className={`h-14 relative overflow-hidden group transition-[height] duration-200`}
          style={{ backgroundColor: bannerColor }}
        >
          <div className="absolute inset-0 bg-black/20 sm:bg-black/0 sm:group-hover:bg-black/30 transition-colors duration-150 flex items-center justify-center gap-3 sm:opacity-0 sm:group-hover:opacity-100">
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />

            {!bannerImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  bannerInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <ImageIcon size={13} />
                Upload image
              </button>
            )}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center max-w-35 sm:max-w-none">
              {BANNER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBannerColorChange(c);
                  }}
                  className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${bannerColor === c ? "border-white scale-110" : "border-white/50"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          className="p-6 border-l-4"
          style={{ borderLeftColor: bannerColor }}
        >
          <input
            type="text"
            value={formTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Form Title"
            className="w-full text-xl font-bold text-gray-900 outline-none border-b-2 border-transparent focus:border-primary-500 bg-transparent pb-1 transition-colors"
          />
          <div className="mt-3">
            <RichInput
              value={formDescription}
              onChange={onDescriptionChange}
              placeholder="Form description (optional)"
              className="text-sm placeholder:text-xs text-gray-900 w-full border-b border-transparent focus:border-gray-300 pb-0.5 transition-colors"
            />
          </div>
        </div>
      </div>
    </>
  );
}
