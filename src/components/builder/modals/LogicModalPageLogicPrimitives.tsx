import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CopySimpleIcon,
  DotsThreeVerticalIcon,
  FlagPennantIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  ConditionalLogicIcon,
  LogicConnectionLinesSvg,
  LogicConnectPreviewSvg,
} from "@/components/icons";
import PageMenuDropdown, {
  type PageMenuDropdownOption,
} from "@/components/builder/layout/form/PageMenuDropdown";
import { PAGE_TYPE_BADGE_CLASS, PAGE_TYPE_ICONS } from "@/constants";
import { countConditionNodes } from "@/components/builder/layout";
import {
  ADD_PAGE_OPTIONS,
  COND_PANEL_TOP,
  COND_ROW_H,
  getLogicBranchId,
  hasBranchCondition,
  NODE_H,
  NODE_W,
  type ConnectionMode,
  type LogicBranch,
  type LogicNode,
  type PageType,
} from "./logicModalPageLogic.shared";

export function ConnectPreview({
  nodes,
  fromId,
  startY,
  curX,
  curY,
  hasTarget,
}: {
  nodes: LogicNode[];
  fromId: string;
  startY?: number;
  curX: number;
  curY: number;
  hasTarget: boolean;
}) {
  const from = nodes.find((node) => node.id === fromId);
  if (!from) return null;

  const x1 = from.x + NODE_W;
  const y1 = typeof startY === "number" ? from.y + startY : from.y + NODE_H / 2;
  const cpOffset = Math.max(60, Math.abs(curX - x1) * 0.5);
  const d = `M ${x1} ${y1} C ${x1 + cpOffset} ${y1} ${curX - cpOffset} ${curY} ${curX} ${curY}`;

  return (
    <>
      <LogicConnectPreviewSvg
        d={d}
        curX={curX}
        curY={curY}
        hasTarget={hasTarget}
      />
      {!hasTarget && (
        <div
          className="pointer-events-none rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60"
          style={{
            position: "absolute",
            left: curX - NODE_W / 2,
            top: curY - NODE_H / 2,
            width: NODE_W,
            height: NODE_H,
          }}
        />
      )}
    </>
  );
}

export function DropTypePicker({
  x,
  y,
  onSelect,
  onClose,
}: {
  x: number;
  y: number;
  onSelect: (type: PageType) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const element = document.getElementById("lm-drop-picker");
      if (element && !element.contains(event.target as Node)) onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

  return (
    <div
      id="lm-drop-picker"
      data-no-drag="true"
      className="absolute z-40"
      style={{ left: x, top: y }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <PageMenuDropdown
        title="Choose page type"
        className="w-44 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg"
        options={ADD_PAGE_OPTIONS.map(
          (option): PageMenuDropdownOption => ({
            id: option.type,
            label: option.label,
            pageType: option.type,
          }),
        )}
        onSelect={(type) => {
          onSelect(type as PageType);
          onClose();
        }}
      />
    </div>
  );
}

export function ConnectionLines({
  nodes,
  branches,
  hoveredBranchId,
  onHoverBranch,
  onDeleteBranch,
}: {
  nodes: LogicNode[];
  branches: LogicBranch[];
  hoveredBranchId: string | null;
  onHoverBranch: (id: string | null) => void;
  onDeleteBranch: (branch: LogicBranch, index: number) => void;
}) {
  return (
    <LogicConnectionLinesSvg
      nodes={nodes}
      branches={branches}
      hoveredBranchId={hoveredBranchId}
      onHoverBranch={onHoverBranch}
      onDeleteBranch={(branch, index) =>
        onDeleteBranch(branch as LogicBranch, index)
      }
      nodeW={NODE_W}
      nodeH={NODE_H}
      condPanelTop={COND_PANEL_TOP}
      condRowH={COND_ROW_H}
    />
  );
}

export function NodeContextMenu({
  x,
  y,
  isFirst,
  pageType,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  onSetFirstPage,
}: {
  x: number;
  y: number;
  isFirst: boolean;
  pageType: PageType;
  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetFirstPage: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const estimatedHeight = isFirst ? 140 : 172;
  const adjustedY =
    y + estimatedHeight > window.innerHeight ? Math.max(4, y - estimatedHeight) : y;
  const adjustedX = Math.min(x, window.innerWidth - 184);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.08 }}
      className="fixed z-[9999] w-44 rounded-xl border border-gray-100 bg-white py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.13)]"
      style={{ left: adjustedX, top: adjustedY }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="space-y-0.5 py-1">
        <button
          onClick={onRename}
          className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <PencilSimpleIcon size={12} className="shrink-0 text-gray-400" />
          Rename
        </button>
        <button
          onClick={onDuplicate}
          className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <CopySimpleIcon size={12} className="shrink-0 text-gray-400" />
          Duplicate
        </button>
      </div>
      {!isFirst && pageType === "page" ? (
        <>
          <div className="h-px bg-gray-100" />
          <div className="py-1">
            <button
              onClick={onSetFirstPage}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
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
      ) : null}
      <div className="h-px bg-gray-100" />
      <div className="py-1">
        <button
          onClick={onDelete}
          className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <TrashSimpleIcon size={12} className="shrink-0" />
          Delete
        </button>
      </div>
    </motion.div>
  );
}

function AddPageDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (type: PageType) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const element = document.getElementById("lm-add-dropdown");
      if (element && !element.contains(event.target as Node)) onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

  return (
    <div
      id="lm-add-dropdown"
      className="absolute right-0 top-7 z-30"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <PageMenuDropdown
        title="Choose page type"
        className="w-44 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg"
        options={ADD_PAGE_OPTIONS.map(
          (option): PageMenuDropdownOption => ({
            id: option.type,
            label: option.label,
            pageType: option.type,
          }),
        )}
        onSelect={(type) => {
          onSelect(type as PageType);
          onClose();
        }}
      />
    </div>
  );
}

export function NodeCard({
  node,
  isFirst,
  isExpanded,
  isDropTarget,
  defaultBranch,
  outBranches,
  onToggleExpand,
  onAddPage,
  onDeleteBranch,
  onOpenBranchCondition,
  onStartConnectDrag,
  onAddConditionalSlot,
  onContextMenuOpen,
  isRenaming,
  onRenameCommit,
  onDoubleClickTitle,
}: {
  node: LogicNode;
  isFirst: boolean;
  isExpanded: boolean;
  isDropTarget: boolean;
  defaultBranch?: LogicBranch;
  outBranches: LogicBranch[];
  onToggleExpand: () => void;
  onAddPage: (type: PageType) => void;
  onDeleteBranch: (branch: LogicBranch, index: number) => void;
  onOpenBranchCondition: (
    branchId: string,
    anchorEl: HTMLButtonElement,
  ) => void;
  onStartConnectDrag: (
    event: React.PointerEvent,
    fromId: string,
    mode: ConnectionMode,
    branchId?: string,
    startY?: number,
  ) => void;
  onAddConditionalSlot: () => void;
  onContextMenuOpen?: (x: number, y: number) => void;
  isRenaming?: boolean;
  onRenameCommit?: (title: string) => void;
  onDoubleClickTitle?: () => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const canAddBranch = node.pageType !== "ending";
  const showConditionalPanel =
    isExpanded && (outBranches.length > 0 || canAddBranch);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRenaming) return;
    requestAnimationFrame(() => {
      renameRef.current?.focus();
      renameRef.current?.select();
    });
  }, [isRenaming]);

  return (
    <div
      className={`overflow-visible rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        isDropTarget
          ? "border-blue-400 ring-4 ring-blue-100"
          : isFirst
            ? "border-blue-400"
            : outBranches.length > 0
              ? "border-primary-400"
              : "border-gray-200"
      }`}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onContextMenuOpen?.(event.clientX, event.clientY);
      }}
    >
      {isFirst ? (
        <div className="absolute -top-3.5 left-3 text-blue-500">
          <FlagPennantIcon size={14} weight="fill" />
        </div>
      ) : null}

      <div
        className="flex cursor-grab select-none items-center gap-2 px-3 py-2.5 active:cursor-grabbing"
        onClick={onToggleExpand}
      >
        <button
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            onContextMenuOpen?.(rect.left, rect.bottom + 4);
          }}
          className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <DotsThreeVerticalIcon size={14} weight="bold" />
        </button>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${PAGE_TYPE_BADGE_CLASS[node.pageType]}`}
        >
          {PAGE_TYPE_ICONS[node.pageType]}
        </span>
        {isRenaming ? (
          <input
            ref={renameRef}
            defaultValue={node.title}
            onBlur={(event) => onRenameCommit?.(event.target.value)}
            onKeyDown={(event) => {
              const input = event.currentTarget;
              if (event.key === "Enter") onRenameCommit?.(input.value);
              if (event.key === "Escape") {
                input.value = node.title;
                onRenameCommit?.(node.title);
              }
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            className="min-w-0 flex-1 rounded border border-primary-400 bg-white px-1 text-xs font-semibold text-gray-800 outline-none"
          />
        ) : (
          <span
            className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-800"
            onDoubleClick={(event) => {
              event.stopPropagation();
              onDoubleClickTitle?.();
            }}
          >
            {node.title}
          </span>
        )}

        {node.pageType !== "ending" && !isRenaming ? (
          <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400">
            DEFAULT
          </span>
        ) : null}

        {node.pageType !== "ending" ? (
          <div
            className="relative shrink-0"
            data-port="true"
            onPointerDown={(event) => {
              event.stopPropagation();
              onStartConnectDrag(event, node.id, "default", defaultBranch?.id);
            }}
            onClick={(event) => {
              event.stopPropagation();
              setShowDropdown((current) => !current);
            }}
          >
            <button className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-gray-700">
              <PlusIcon size={11} weight="bold" />
            </button>
            {showDropdown ? (
              <AddPageDropdown
                onSelect={onAddPage}
                onClose={() => setShowDropdown(false)}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {showConditionalPanel ? (
        <div
          data-no-drag="true"
          className="space-y-1.5 border-t border-gray-100 px-3 py-2"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {outBranches.map((branch, branchIndex) => {
            const branchId = getLogicBranchId(branch, branchIndex);
            const hasCondition = hasBranchCondition(branch);
            const conditionCount = branch.conditionTree?.items.length
              ? countConditionNodes(branch.conditionTree)
              : 0;
            const rowStartY =
              COND_PANEL_TOP + branchIndex * COND_ROW_H + COND_ROW_H / 2;

            return (
              <div
                key={`${branchId}-${branchIndex}`}
                className="flex items-center gap-1.5"
              >
                <button
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenBranchCondition(branchId, event.currentTarget);
                  }}
                  className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
                    hasCondition
                      ? "border-primary-300 bg-primary-50 text-primary-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <ConditionalLogicIcon />
                  <span className="truncate">Set route condition</span>
                  {conditionCount > 0 ? (
                    <span className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-700">
                      {conditionCount}
                    </span>
                  ) : null}
                </button>

                <button
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onStartConnectDrag(
                      event,
                      node.id,
                      "conditional",
                      branchId,
                      rowStartY,
                    );
                  }}
                  onClick={(event) => event.stopPropagation()}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-gray-700"
                  title="Drag to connect this branch to a page"
                >
                  <PlusIcon size={11} weight="bold" />
                </button>

                <button
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteBranch(branch, branchIndex);
                  }}
                  className="shrink-0 rounded p-0.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Delete branch"
                >
                  <XIcon size={10} weight="bold" />
                </button>
              </div>
            );
          })}

          {canAddBranch ? (
            <div className="relative group/tip">
              <button
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onAddConditionalSlot();
                }}
                className="flex items-center gap-1 py-0.5 text-[11px] font-medium text-gray-400 transition-colors hover:text-primary-600"
              >
                <PlusIcon size={10} weight="bold" />
                Add branch
              </button>
              <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 hidden group-hover/tip:block">
                <div className="w-52 rounded-lg bg-gray-900 px-3 py-2 text-white shadow-lg">
                  <p className="mb-0.5 text-[11px] font-semibold">Add branch</p>
                  <p className="text-[10px] leading-snug text-gray-300">
                    Add a new route, connect it to a page, then set the answer
                    condition for that route.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
