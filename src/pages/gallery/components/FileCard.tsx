import { useState } from "react";
import {
  DownloadSimple,
  File,
  FileImage,
  FilePdf,
  Trash,
} from "@phosphor-icons/react";
import { isGalleryImageFile } from "../utils";

type Props = {
  url: string;
  filename: string;
  fieldLabel: string;
  onDelete: () => void;
  onPreview: () => void;
};

export default function FileCard({
  url,
  filename,
  fieldLabel,
  onDelete,
  onPreview,
}: Props) {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  const isImage = isGalleryImageFile(filename);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group/card relative rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div
        className={`aspect-video flex items-center justify-center bg-gray-50 ${isImage && !imgError ? "cursor-zoom-in" : ""}`}
        onClick={isImage && !imgError ? onPreview : undefined}
      >
        {isImage && !imgError ? (
          <img
            src={url}
            alt={filename}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 p-4">
            {extension === "pdf" ? (
              <FilePdf size={32} className="text-red-300" />
            ) : isImage ? (
              <FileImage size={32} className="text-blue-300" />
            ) : (
              <File size={32} className="text-gray-300" />
            )}
          </div>
        )}
      </div>
      <div className="px-2.5 py-2">
        <p className="text-xs font-semibold text-gray-800 truncate">
          {filename}
        </p>
        <p className="text-[10px] text-gray-400">{fieldLabel}</p>
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 text-gray-600 hover:text-blue-600 hover:bg-white transition-colors shadow cursor-pointer"
          title="Download"
        >
          <DownloadSimple size={13} weight="bold" />
        </a>
        <button
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white transition-colors cursor-pointer shadow"
          title="Delete"
        >
          <Trash size={13} weight="bold" />
        </button>
      </div>
    </div>
  );
}

