import { useState } from "react";
import {
  TextHOneIcon,
  MegaphoneIcon,
  TextAlignLeftIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import type { FieldType } from "@/types/form";

type Props = {
  onAddField?: (type: FieldType) => void;
  showDivider?: boolean;
  showFillAgain?: boolean;
  showUrlBtn?: boolean;
  onToggleDivider?: () => void;
  onToggleFillAgain?: () => void;
  onToggleUrlBtn?: () => void;
};

const DISPLAY_ITEMS: {
  label: string;
  icon: React.ReactNode;
  bg: string;
  type: FieldType;
}[] = [
  {
    label: "Heading",
    icon: <TextHOneIcon size={15} />,
    bg: "bg-gray-100 text-gray-500",
    type: "title_block",
  },
  {
    label: "Banner",
    icon: <MegaphoneIcon size={15} />,
    bg: "bg-amber-100 text-amber-500",
    type: "banner_block",
  },
  {
    label: "Paragraph",
    icon: <TextAlignLeftIcon size={15} />,
    bg: "bg-gray-100 text-gray-500",
    type: "paragraph",
  },
];

const NAV_ITEMS = [
  {
    label: "Divider",
    bg: "bg-rose-100 text-rose-500",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12h18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Fill again",
    bg: "bg-rose-100 text-rose-500",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12a8 8 0 018-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M8 8l4-4 4 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "URL button",
    bg: "bg-rose-100 text-rose-500",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function EndingSettingsPanel({
  onAddField,
  showDivider,
  showFillAgain,
  showUrlBtn,
  onToggleDivider,
  onToggleFillAgain,
  onToggleUrlBtn,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredDisplay = search.trim()
    ? DISPLAY_ITEMS.filter((i) =>
        i.label.toLowerCase().includes(search.toLowerCase()),
      )
    : DISPLAY_ITEMS;

  return (
    <div className="w-72 shrink-0 bg-white border-r border-gray-100 shadow-[4px_0_16px_rgba(0,0,0,0.07)] z-10 flex flex-col overflow-hidden h-full">
      <div className="flex-1 overflow-y-auto">
        {/* Field search */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <MagnifyingGlassIcon size={13} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search fields"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-xs text-gray-700 bg-transparent outline-none placeholder:text-gray-400 min-w-0"
            />
          </div>
        </div>

        {/* Display text */}
        {filteredDisplay.length > 0 && (
          <div className="px-2 pb-3">
            <p className="px-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Display text
            </p>
            <div className="grid grid-cols-3 gap-1">
              {filteredDisplay.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onAddField?.(item.type)}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl p-2 text-center transition-all h-18 bg-white border cursor-pointer border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"
                  title={item.label}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[9px] font-medium leading-tight text-center text-gray-600 line-clamp-2">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation & Layout */}
        <div className="px-2 pb-4">
          <p className="px-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Navigation & Layout
          </p>
          <div className="grid grid-cols-3 gap-1">
            {[
              {
                ...NAV_ITEMS[0],
                active: showDivider,
                onToggle: onToggleDivider,
              },
              {
                ...NAV_ITEMS[1],
                active: showFillAgain,
                onToggle: onToggleFillAgain,
              },
              { ...NAV_ITEMS[2], active: showUrlBtn, onToggle: onToggleUrlBtn },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.onToggle}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-2 text-center transition-all h-18 border cursor-pointer ${
                  item.active
                    ? "bg-rose-50 border-rose-200 shadow-sm"
                    : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"
                }`}
                title={item.label}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}
                >
                  {item.icon}
                </span>
                <span className="text-[9px] font-medium leading-tight text-center text-gray-600 line-clamp-2">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
