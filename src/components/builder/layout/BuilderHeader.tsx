import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  EyeIcon,
  ListBulletsIcon,
  ChartBarIcon,
} from "@phosphor-icons/react";

type Tab = "questions" | "responses";

type BuilderHeaderProps = {
  formTitle: string;
  onTitleChange: (v: string) => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onBack: () => void;
  onPreview: () => void;
};

export default function BuilderHeader({
  formTitle,
  onTitleChange,
  activeTab,
  onTabChange,
  onBack,
  onPreview,
}: BuilderHeaderProps) {
  return (
    <header className="bg-primary-800/95 backdrop-blur-sm sticky top-0 z-60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm shrink-0 font-medium"
        >
          <ArrowLeftIcon size={15} weight="bold" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="h-5 w-px bg-white/20 shrink-0" />
        <input
          type="text"
          value={formTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="Untitled Form"
          className="flex-1 text-sm font-semibold text-white placeholder:text-white/40 outline-none border-b border-transparent hover:border-white/30 focus:border-white/60 transition-colors bg-transparent min-w-0"
        />
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onTabChange("questions")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === "questions"
                ? "text-white bg-white/15"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <ListBulletsIcon size={14} />
            <span className="hidden sm:inline">Questions</span>
          </button>
          <button
            onClick={() => onTabChange("responses")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === "responses"
                ? "text-white bg-white/15"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <ChartBarIcon size={14} />
            <span className="hidden sm:inline">Responses</span>
          </button>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onPreview}
          className="flex items-center gap-1.5 bg-white text-primary-700 px-3 sm:px-3.5 py-1.5 text-xs font-semibold hover:bg-primary-50 transition-colors rounded shrink-0"
        >
          <EyeIcon size={13} />
          <span className="hidden sm:inline">Preview</span>
        </motion.button>
      </div>
    </header>
  );
}
