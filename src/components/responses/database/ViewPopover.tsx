import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { motion } from "framer-motion";
import {
  CopySimpleIcon,
  DownloadSimpleIcon,
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashSimpleIcon,
} from "@phosphor-icons/react";
import type { ResultDatabaseView } from "@/types/results";

type ViewPopoverProps = {
  activeView: ResultDatabaseView;
  views: ResultDatabaseView[];
  onCreateView: () => void;
  onDeleteView: (viewId: string) => void;
  onDuplicateView: (viewId: string) => void;
  onExportView: (viewId: string) => void;
  onRenameView: (viewId: string, name: string) => void;
  onSelectView: (viewId: string) => void;
};

export default function ViewPopover({
  activeView,
  views,
  onCreateView,
  onDeleteView,
  onDuplicateView,
  onExportView,
  onRenameView,
  onSelectView,
}: ViewPopoverProps) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<{
    left: number;
    top: number;
    viewId: string;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open && !menu) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      const target = event.target as HTMLElement;
      if (target.closest("[data-view-action-menu]")) return;
      setOpen(false);
      setMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menu, open]);

  const activeMenuView = views.find((view) => view.id === menu?.viewId) ?? null;

  const openActionMenu = (
    event: ReactMouseEvent,
    viewId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const dropdownRect = dropdownRef.current?.getBoundingClientRect();
    const triggerRect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = 232;
    const leftFromDropdown =
      dropdownRect && dropdownRect.right + 8 + menuWidth <= window.innerWidth - 8
        ? dropdownRect.right + 8
        : dropdownRect
          ? dropdownRect.left - menuWidth - 8
          : triggerRect.right + 8;

    setMenu({
      left: Math.min(Math.max(leftFromDropdown, 8), window.innerWidth - menuWidth - 8),
      top: Math.min(
        Math.max(triggerRect.top - 2, 8),
        window.innerHeight - menuHeight - 8,
      ),
      viewId,
    });
  };

  const renameView = () => {
    if (!activeMenuView) return;
    const nextName = window.prompt("Rename view", activeMenuView.name);
    if (!nextName?.trim()) return;
    onRenameView(activeMenuView.id, nextName.trim());
    setMenu(null);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
      >
        <span className="max-w-36 truncate">{activeView.name}</span>
      </button>

      {open ? (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-12 z-[140] w-44 overflow-hidden rounded-sm border border-gray-100/80 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)]"
        >
          <div className="space-y-0.5 py-1">
            {views.map((view) => (
              <div
                key={view.id}
                onContextMenu={(event) => openActionMenu(event, view.id)}
                className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left transition-colors ${
                  activeView.id === view.id
                    ? "bg-gray-50 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectView(view.id);
                    setOpen(false);
                  }}
                  className="min-w-0 flex-1 truncate text-left text-xs font-semibold"
                >
                  {view.name}
                </button>
                <button
                  type="button"
                  onClick={(event) => openActionMenu(event, view.id)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="View actions"
                >
                  <DotsThreeVerticalIcon size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="h-px bg-gray-100" />
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                onCreateView();
                setOpen(false);
              }}
              className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
            >
              <PlusIcon
                size={12}
                className="shrink-0 text-gray-500 transition-colors group-hover:text-gray-700"
              />
              Create view
            </button>
          </div>
        </div>
      ) : null}

      {menu && activeMenuView ? (
        <motion.div
          data-view-action-menu="true"
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{ duration: 0.08, ease: "easeOut" }}
          className="fixed z-[150] w-44 select-none overflow-hidden rounded-sm border border-gray-100/80 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)]"
          style={{ left: menu.left, top: menu.top }}
        >
          <div className="px-3 pt-2.5 pb-2">
            <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
              View
            </p>
            <p
              className="truncate text-[11px] font-semibold text-gray-800"
              title={activeMenuView.name}
            >
              {activeMenuView.name}
            </p>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="space-y-0.5 py-1">
            <button
              type="button"
              onClick={renameView}
              className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
            >
              <PencilSimpleIcon
                size={12}
                className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
              />
              Rename
            </button>
            <button
              type="button"
              onClick={() => {
                onDuplicateView(activeMenuView.id);
                setMenu(null);
              }}
              className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
            >
              <CopySimpleIcon
                size={12}
                className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
              />
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => {
                onExportView(activeMenuView.id);
                setMenu(null);
              }}
              className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
            >
              <DownloadSimpleIcon
                size={12}
                className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
              />
              Export to Excel
            </button>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="py-1">
            <button
              type="button"
              disabled={views.length <= 1}
              onClick={() => {
                onDeleteView(activeMenuView.id);
                setMenu(null);
              }}
              className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <TrashSimpleIcon
                size={12}
                className="shrink-0 transition-transform group-hover:scale-110 group-active:scale-95"
              />
              Delete
            </button>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
