import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  EyeIcon,
  FloppyDiskIcon,
  SpinnerGapIcon,
  RocketLaunchIcon,
  ShareNetworkIcon,
  DotsThreeVerticalIcon,
  ProhibitIcon,
  LockIcon,
  GaugeIcon,
  ShuffleIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";

type Tab = "questions" | "responses";

type BuilderHeaderProps = {
  formTitle: string;
  onTitleChange: (v: string) => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onBack: () => void;
  onPreview: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  eventStatus?: "draft" | "active" | "closed";
  onPublish?: () => void;
  isPublishing?: boolean;
  onShare?: () => void;
  onUnpublish?: () => void;
  onClose?: () => void;
};

export default function BuilderHeader({
  formTitle,
  onTitleChange,
  activeTab,
  onTabChange,
  onBack,
  onPreview,
  onSave,
  isSaving,
  isDirty,
  eventStatus,
  onPublish,
  isPublishing,
  onShare,
  onUnpublish,
  onClose,
}: BuilderHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showOverflow = eventStatus === "active" && (onUnpublish || onClose);

  const toolBtn = (active: boolean) =>
    `flex flex-col items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors shrink-0 ${
      active
        ? "text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
        : "text-white/20 cursor-default"
    }`;

  const titleInput =
    "flex-1 text-sm font-semibold text-white placeholder:text-white/40 outline-none bg-transparent min-w-0 border-b border-white/20 hover:border-white/40 focus:border-white/60 px-1.5 py-1 transition-colors";

  const ctaBase =
    "flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors rounded-lg shrink-0";

  return (
    <header className="bg-primary-800 sticky top-0 z-60">
      <div className="max-w-5xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 pt-3 pb-5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeftIcon size={18} weight="bold" />
            <span className="hidden sm:inline text-sm font-medium">Back</span>
          </button>

          <input
            type="text"
            value={formTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Untitled Form"
            className={`hidden sm:block ml-2 rounded ${titleInput}`}
          />
          <div className="flex-1 sm:hidden" />

          <div className="flex items-end gap-0.5 shrink-0">
            {onSave && (
              <motion.button
                whileTap={isDirty ? { scale: 0.92 } : undefined}
                onClick={isDirty && !isSaving ? onSave : undefined}
                className={toolBtn(!!isDirty)}
              >
                {isSaving ? (
                  <SpinnerGapIcon size={18} className="animate-spin" />
                ) : (
                  <FloppyDiskIcon size={18} />
                )}
                <span className="text-[10px] sm:text-[11px] font-medium leading-none">
                  {isSaving ? "Saving" : "Save"}
                </span>
              </motion.button>
            )}

            <button onClick={onPreview} className={toolBtn(true)}>
              <EyeIcon size={18} />
              <span className="text-[10px] sm:text-[11px] font-medium leading-none">Preview</span>
            </button>

            <button disabled className={toolBtn(false)}>
              <GaugeIcon size={18} />
              <span className="text-[10px] sm:text-[11px] font-medium leading-none">Miner</span>
            </button>

            <button disabled className={toolBtn(false)}>
              <ShuffleIcon size={18} />
              <span className="text-[10px] sm:text-[11px] font-medium leading-none">Random</span>
            </button>

            <button disabled className={toolBtn(false)}>
              <PaperPlaneTiltIcon size={18} />
              <span className="text-[10px] sm:text-[11px] font-medium leading-none">Email</span>
            </button>

            {showOverflow && (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className={toolBtn(true)}
                >
                  <DotsThreeVerticalIcon size={18} weight="bold" />
                  <span className="text-[10px] sm:text-[11px] font-medium leading-none">More</span>
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100/80 overflow-hidden z-50"
                    >
                      <div className="p-1">
                        {onUnpublish && (
                          <button
                            onClick={() => { setMenuOpen(false); onUnpublish(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                          >
                            <ProhibitIcon size={14} />
                            Unpublish
                          </button>
                        )}
                        {onClose && (
                          <button
                            onClick={() => { setMenuOpen(false); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                          >
                            <LockIcon size={14} />
                            Close form
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Desktop CTA */}
          {eventStatus === "draft" && onPublish && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onPublish}
              disabled={isPublishing}
              className={`hidden sm:flex px-4 py-2 disabled:opacity-50 ${ctaBase}`}
            >
              {isPublishing ? (
                <SpinnerGapIcon size={13} className="animate-spin" />
              ) : (
                <RocketLaunchIcon size={13} />
              )}
              <span>{isPublishing ? "Publishing..." : "Publish"}</span>
            </motion.button>
          )}
          {eventStatus === "active" && onShare && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onShare}
              className={`hidden sm:flex px-4 py-2 ${ctaBase}`}
            >
              <ShareNetworkIcon size={13} />
              <span>Share</span>
            </motion.button>
          )}
        </div>

        {/* Mobile: title + CTA */}
        <div className="sm:hidden flex items-center justify-between gap-3 px-4 pb-3">
          <input
            type="text"
            value={formTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Untitled Form"
            className={`rounded ${titleInput}`}
          />
          {eventStatus === "draft" && onPublish && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onPublish}
              disabled={isPublishing}
              className={`px-3.5 py-2 disabled:opacity-50 ${ctaBase}`}
            >
              {isPublishing ? (
                <SpinnerGapIcon size={13} className="animate-spin" />
              ) : (
                <RocketLaunchIcon size={13} />
              )}
              <span>{isPublishing ? "Publishing..." : "Publish"}</span>
            </motion.button>
          )}
          {eventStatus === "active" && onShare && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onShare}
              className={`px-3.5 py-2 ${ctaBase}`}
            >
              <ShareNetworkIcon size={13} />
              <span>Share</span>
            </motion.button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-8">
          <button
            onClick={() => onTabChange("questions")}
            className={`pt-1.5 pb-2.5 text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === "questions"
                ? "text-white border-b-3 border-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Questions
          </button>
          <button
            onClick={() => onTabChange("responses")}
            className={`pt-1.5 pb-2.5 text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === "responses"
                ? "text-white border-b-3 border-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Responses
          </button>
        </div>
      </div>
    </header>
  );
}
