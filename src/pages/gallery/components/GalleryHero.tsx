import { PageHeroBanner } from "@/components/layout";
import type { GalleryTab } from "../utils";

type Props = {
  tab: GalleryTab;
  totalFiles: number;
  totalMedia: number;
  onTabChange: (tab: GalleryTab) => void;
};

const GALLERY_TABS: GalleryTab[] = ["files", "media"];

export default function GalleryHero({
  tab,
  totalFiles,
  totalMedia,
  onTabChange,
}: Props) {
  return (
    <PageHeroBanner contentClassName="pt-8 sm:pt-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-10 pb-6 sm:pb-8">
        <div>
          <p className="text-primary-300 text-sm font-bold mb-1">Storage</p>
          <h1 className="text-[1.75rem] sm:text-[2rem] font-bold text-white leading-tight">
            Gallery
          </h1>
          <p className="text-white text-sm mt-1.5">
            Browse, preview, and manage your uploaded files.
          </p>
        </div>
        <div className="flex items-stretch bg-white/10 border border-white/15 rounded-xl backdrop-blur-sm divide-x divide-white/10 shrink-0 w-full sm:w-auto">
          <div className="flex flex-col items-center justify-center flex-1 sm:flex-none sm:px-8 py-4 sm:py-5 gap-1 sm:gap-1.5">
            <span className="text-2xl sm:text-[2.25rem] font-black text-white leading-none tracking-tight tabular-nums">
              {totalFiles}
            </span>
            <span className="text-[10px] sm:text-[11px] text-white/50 font-semibold tracking-widest uppercase">
              Form Files
            </span>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 sm:flex-none sm:px-8 py-4 sm:py-5 gap-1 sm:gap-1.5">
            <span className="text-2xl sm:text-[2.25rem] font-black text-white leading-none tracking-tight tabular-nums">
              {totalMedia}
            </span>
            <span className="text-[10px] sm:text-[11px] text-white/50 font-semibold tracking-widest uppercase">
              Media
            </span>
          </div>
        </div>
      </div>

      <div className="flex -mx-4 sm:-mx-8 px-4 sm:px-8">
        {GALLERY_TABS.map((nextTab) => (
          <button
            key={nextTab}
            onClick={() => onTabChange(nextTab)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === nextTab
                ? "border-white text-white"
                : "border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            {nextTab === "files" ? "Form Files" : "Media"}
          </button>
        ))}
      </div>
    </PageHeroBanner>
  );
}

