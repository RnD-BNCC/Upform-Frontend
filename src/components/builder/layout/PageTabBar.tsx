import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  TreeStructureIcon,
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  CopySimpleIcon,
  TrashIcon,
  SpinnerGapIcon,
  FlagPennantIcon,
} from "@phosphor-icons/react";
import type { FormSection } from "@/types/form";

// ─── Page type icons / colors ─────────────────────────────────────────────────

const PAGE_TYPE_ICONS: Record<string, React.ReactNode> = {
  cover: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 12h8M8 8h8M8 16h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  page: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 9h8M8 13h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  ending: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 12l3 3 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const PAGE_TYPE_COLORS: Record<string, string> = {
  cover: "text-blue-500",
  page: "text-amber-500",
  ending: "text-rose-500",
};

// ─── Add page dropdown ────────────────────────────────────────────────────────

type AddPageType = "page" | "cover" | "ending";

const ADD_PAGE_OPTIONS: {
  type: AddPageType;
  label: string;
  description: string;
}[] = [
  { type: "page", label: "Form", description: "Page to collect user input" },
  { type: "cover", label: "Cover", description: "Welcome users to your form" },
  { type: "ending", label: "Ending", description: "Show a thank you page" },
];

// ─── Tab context menu (matches home ContextMenu.tsx style) ────────────────────

type TabContextMenuProps = {
  x: number;
  y: number;
  idx: number;
  page: FormSection;
  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetFirstPage: () => void;
};

function TabContextMenu({
  x,
  y,
  idx,
  page,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  onSetFirstPage,
}: TabContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const menuEstH = 192;
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY =
    y + menuEstH > window.innerHeight ? Math.max(4, y - menuEstH) : y;

  const pageType = page.pageType ?? "page";
  const pageName =
    page.title ||
    (pageType === "cover"
      ? "Cover"
      : pageType === "ending"
        ? "Ending"
        : "Page");

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={{ duration: 0.08, ease: "easeOut" }}
      className="fixed z-100 bg-white rounded-sm shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100/80 w-44 select-none overflow-hidden"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="px-3 pt-2.5 pb-2">
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
          Page
        </p>
        <p
          className="text-[11px] font-semibold text-gray-800 truncate"
          title={pageName}
        >
          {pageName}
        </p>
      </div>

      <div className="h-px bg-gray-100" />

      <div className="py-1 space-y-0.5">
        <button
          onClick={onRename}
          className="group w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition-colors text-left"
        >
          <PencilSimpleIcon
            size={12}
            className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors"
          />
          Rename
        </button>
        <button
          onClick={onDuplicate}
          className="group w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition-colors text-left"
        >
          <CopySimpleIcon
            size={12}
            className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors"
          />
          Duplicate
        </button>
      </div>

      {idx > 0 && (
        <>
          <div className="h-px bg-gray-100" />
          <div className="py-1">
            <button
              onClick={onSetFirstPage}
              className="group w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors text-left"
            >
              <FlagPennantIcon
                size={12}
                weight="fill"
                className="shrink-0 text-blue-500"
              />
              Set as first page
            </button>
          </div>
        </>
      )}

      <div className="h-px bg-gray-100" />

      <div className="py-1">
        <button
          onClick={onDelete}
          className="group w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 active:bg-red-100 transition-colors text-left"
        >
          <TrashIcon
            size={12}
            className="shrink-0 transition-transform group-hover:scale-110 group-active:scale-95"
          />
          Delete
        </button>
      </div>
    </motion.div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  pages: FormSection[];
  activePageIdx: number;
  isAddingPage?: boolean;
  onPageSelect: (idx: number) => void;
  onAddPage: (type: AddPageType) => void;
  onLogicOpen: () => void;
  onRenamePage: (idx: number, title: string) => void;
  onDeletePage: (idx: number) => void;
  onDuplicatePage: (idx: number) => void;
  onReorderPage: (fromIdx: number, toIdx: number) => void;
  onSetFirstPage: (idx: number) => void;
};

// ─── PageTabBar ───────────────────────────────────────────────────────────────

export default function PageTabBar({
  pages,
  activePageIdx,
  isAddingPage,
  onPageSelect,
  onAddPage,
  onLogicOpen,
  onRenamePage,
  onDeletePage,
  onDuplicatePage,
  onReorderPage,
  onSetFirstPage,
}: Props) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [tabMenu, setTabMenu] = useState<{
    idx: number;
    x: number;
    y: number;
  } | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const addMenuRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(e.target as Node)
      ) {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (editingIdx !== null) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingIdx]);

  function commitRename() {
    if (editingIdx !== null) {
      const trimmed = editingTitle.trim();
      if (trimmed) onRenamePage(editingIdx, trimmed);
      setEditingIdx(null);
      setEditingTitle("");
    }
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditingTitle(pages[idx]?.title || "");
  }

  function openTabMenu(idx: number, x: number, y: number) {
    setTabMenu({ idx, x, y });
  }

  function handleTabPointerDown(e: React.PointerEvent, idx: number) {
    if (editingIdx !== null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingIdx(idx);
    setDragOverIdx(idx);
  }

  function handleTabsPointerMove(e: React.PointerEvent) {
    if (draggingIdx === null || !tabsRef.current) return;
    const tabs = Array.from(
      tabsRef.current.querySelectorAll<HTMLElement>("[data-tabidx]"),
    );
    for (const tab of tabs) {
      const rect = tab.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right) {
        const idx = parseInt(tab.dataset.tabidx ?? "-1", 10);
        if (idx >= 0) setDragOverIdx(idx);
        break;
      }
    }
  }

  function handleTabsPointerUp() {
    if (
      draggingIdx !== null &&
      dragOverIdx !== null &&
      draggingIdx !== dragOverIdx
    ) {
      onReorderPage(draggingIdx, dragOverIdx);
      onPageSelect(dragOverIdx);
    }
    setDraggingIdx(null);
    setDragOverIdx(null);
  }

  return (
    <>
      <div className="h-12 bg-white flex items-center px-3 gap-2 shrink-0 z-20">
        {/* Add page */}
        <div ref={addMenuRef} className="relative shrink-0">
          <button
            onClick={() => !isAddingPage && setAddMenuOpen((v) => !v)}
            disabled={isAddingPage}
            className="flex border items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingPage ? (
              <SpinnerGapIcon size={13} className="animate-spin" />
            ) : (
              <PlusIcon size={13} weight="bold" />
            )}
            <span>{isAddingPage ? "Adding..." : "Add page"}</span>
          </button>

          <AnimatePresence>
            {addMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.1 }}
                className="absolute bottom-full mb-1 left-0 w-52 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 py-1.5 z-50"
              >
                <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Choose a page type
                </p>
                {ADD_PAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => {
                      onAddPage(opt.type);
                      setAddMenuOpen(false);
                    }}
                    className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span
                      className={`mt-0.5 ${PAGE_TYPE_COLORS[opt.type] ?? "text-gray-500"}`}
                    >
                      {PAGE_TYPE_ICONS[opt.type]}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-gray-400 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-gray-200 shrink-0" />

        {/* Page tabs */}
        <div
          ref={tabsRef}
          className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0"
          onPointerMove={handleTabsPointerMove}
          onPointerUp={handleTabsPointerUp}
        >
          {pages.map((page, idx) => {
            const pageType = page.pageType ?? "page";
            const isActive = idx === activePageIdx;
            const isDragOver =
              dragOverIdx === idx &&
              draggingIdx !== null &&
              draggingIdx !== idx;
            const isEditing = editingIdx === idx;

            return (
              <motion.div
                key={page.id}
                layout
                layoutId={page.id}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                data-tabidx={idx}
                className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer select-none ${
                  isDragOver
                    ? "ring-2 ring-primary-400 bg-primary-50"
                    : isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                } ${draggingIdx === idx ? "opacity-40" : ""}`}
                onClick={() => {
                  if (!isEditing) onPageSelect(idx);
                }}
                onDoubleClick={() => startEdit(idx)}
                onPointerDown={(e) => handleTabPointerDown(e, idx)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openTabMenu(idx, e.clientX, e.clientY);
                }}
              >
                <span
                  className={`${PAGE_TYPE_COLORS[pageType] ?? "text-gray-500"} shrink-0`}
                >
                  {PAGE_TYPE_ICONS[pageType]}
                </span>

                {isEditing ? (
                  <input
                    ref={editInputRef}
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") {
                        setEditingIdx(null);
                        setEditingTitle("");
                      }
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="w-20 bg-white border border-primary-400 rounded px-1 text-xs text-gray-800 outline-none"
                  />
                ) : (
                  <span>
                    {page.title ||
                      (pageType === "cover"
                        ? "Cover"
                        : pageType === "ending"
                          ? "Ending"
                          : "Page")}
                  </span>
                )}

                {/* ⋮ always visible */}
                {!isEditing && (
                  <button
                    className="ml-0.5 p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      openTabMenu(idx, rect.left, rect.bottom + 4);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <DotsThreeVerticalIcon size={12} weight="bold" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Logic button */}
        <button
          onClick={onLogicOpen}
          className="flex border items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2.5 py-1.5 rounded-md transition-colors shrink-0"
        >
          <TreeStructureIcon size={13} />
          <span>Logic</span>
        </button>
      </div>

      {/* Tab context menu (portal-style fixed) */}
      <AnimatePresence>
        {tabMenu !== null && pages[tabMenu.idx] && (
          <TabContextMenu
            x={tabMenu.x}
            y={tabMenu.y}
            idx={tabMenu.idx}
            page={pages[tabMenu.idx]}
            onClose={() => setTabMenu(null)}
            onRename={() => {
              startEdit(tabMenu.idx);
              setTabMenu(null);
            }}
            onDuplicate={() => {
              onDuplicatePage(tabMenu.idx);
              setTabMenu(null);
            }}
            onDelete={() => {
              onDeletePage(tabMenu.idx);
              setTabMenu(null);
            }}
            onSetFirstPage={() => {
              onSetFirstPage(tabMenu.idx);
              setTabMenu(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
