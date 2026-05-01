import { useState, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon,
  TextTIcon,
  TrashSimpleIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
} from "@phosphor-icons/react";
import type { FormField } from "@/types/form";

type Props = {
  src: string;
  imgRef?: React.RefObject<HTMLInputElement | null>;
  imageWidth?: number;
  imageAlign?: "left" | "center" | "right";
  imageCaption?: string;
  onChangeImage?: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
};

export const ResizableImage = memo(function ResizableImage({
  src,
  imgRef,
  imageWidth,
  imageAlign,
  imageCaption,
  onChangeImage,
  onUpdate,
  onRemove,
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef({ startX: 0, startWidth: 100 });

  const startResize = useCallback(
    (e: React.MouseEvent, direction: "left" | "right") => {
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = { startX: e.clientX, startWidth: imageWidth ?? 100 };
      const onMove = (ev: MouseEvent) => {
        const cw = wrapperRef.current?.parentElement?.getBoundingClientRect().width ?? 600;
        const delta =
          direction === "right"
            ? ev.clientX - resizeRef.current.startX
            : resizeRef.current.startX - ev.clientX;
        const pct = Math.max(20, Math.min(100, resizeRef.current.startWidth + (delta / cw) * 100));
        onUpdate({ imageWidth: Math.round(pct) });
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [imageWidth, onUpdate],
  );

  return (
    <div
      ref={wrapperRef}
      style={{ width: `${imageWidth ?? 100}%` }}
      className={`relative group/imgq ${
        imageAlign === "center" ? "mx-auto" : imageAlign === "right" ? "ml-auto" : ""
      }`}
    >
      <img src={src} className="w-full rounded-lg object-cover block" alt="" />

      {imageCaption != null && (
        <input
          value={imageCaption}
          onChange={(e) => onUpdate({ imageCaption: e.target.value || undefined })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Add caption..."
          className="theme-question-caption w-full bg-transparent text-center text-xs text-gray-500 mt-1 outline-none border-b border-transparent transition-colors focus:border-gray-300"
        />
      )}

      <div className="absolute inset-0 rounded-lg bg-black/0 group-hover/imgq:bg-black/20 transition-colors pointer-events-none" />

      <button
        onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
        className="absolute top-2 left-2 opacity-0 group-hover/imgq:opacity-100 bg-white/90 text-gray-700 text-xs px-2.5 py-1 rounded-lg shadow-sm font-medium transition-opacity"
      >
        ···
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute top-9 left-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 min-w-44 overflow-hidden"
          >
            <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  onClick={(e) => { e.stopPropagation(); onUpdate({ imageAlign: align }); }}
                  className={`p-1.5 rounded transition-colors ${
                    (imageAlign ?? "left") === align ? "bg-primary-50 text-primary-600" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {align === "left" ? <TextAlignLeftIcon size={18} /> : align === "center" ? <TextAlignCenterIcon size={18} /> : <TextAlignRightIcon size={18} />}
                </button>
              ))}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChangeImage?.();
                imgRef?.current?.click();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ImageIcon size={16} /> Ubah
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onUpdate({ imageCaption: imageCaption ?? "" }); setShowMenu(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <TextTIcon size={16} /> Tambahkan teks
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); setShowMenu(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50"
            >
              <TrashSimpleIcon size={16} /> Hapus
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onMouseDown={(e) => startResize(e, "right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-8 bg-white border border-gray-300 rounded-full cursor-ew-resize shadow-sm opacity-0 group-hover/imgq:opacity-100 transition-opacity z-10"
      />
      <div
        onMouseDown={(e) => startResize(e, "left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-8 bg-white border border-gray-300 rounded-full cursor-ew-resize shadow-sm opacity-0 group-hover/imgq:opacity-100 transition-opacity z-10"
      />
    </div>
  );
});
