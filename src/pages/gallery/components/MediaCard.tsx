import { useState } from "react";
import { Link, Trash, Warning } from "@phosphor-icons/react";
import type { GalleryMediaItem } from "@/api/gallery";
import { formatGalleryFileSize } from "../utils";

type Props = {
  item: GalleryMediaItem;
  onDelete: () => void;
  onCopy: () => void;
  onPreview: () => void;
};

export default function MediaCard({
  item,
  onDelete,
  onCopy,
  onPreview,
}: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`group/card relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 aspect-video ${!imgError ? "cursor-zoom-in" : ""}`}
      onClick={!imgError ? onPreview : undefined}
    >
      {imgError ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
          <Warning size={28} />
        </div>
      ) : (
        <img
          src={item.url}
          alt={item.filename}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all">
        <p className="text-[11px] font-semibold text-white truncate">
          {item.filename}
        </p>
        <p className="text-[10px] text-white/60 truncate">
          {formatGalleryFileSize(item.size)}
        </p>
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
        <button
          onClick={(event) => {
            event.stopPropagation();
            onCopy();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 text-gray-600 hover:text-blue-600 hover:bg-white transition-colors cursor-pointer shadow"
          title="Copy URL"
        >
          <Link size={13} weight="bold" />
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white transition-colors cursor-pointer shadow"
          title="Delete"
        >
          <Trash size={13} weight="bold" />
        </button>
      </div>
    </div>
  );
}
