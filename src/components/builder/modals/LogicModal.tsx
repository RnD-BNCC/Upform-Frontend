import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XIcon,
  PlusIcon,
  DotsThreeVerticalIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsOutIcon,
  PencilSimpleIcon,
  FloppyDiskIcon,
  FlagPennantIcon,
  CopySimpleIcon,
  TrashSimpleIcon,
} from "@phosphor-icons/react";
import type { FormSection } from "@/types/form";

// ─── Types ────────────────────────────────────────────────────────────────────

type PageType = "cover" | "page" | "ending";

type LogicNode = {
  id: string;
  pageType: PageType;
  title: string;
  x: number;
  y: number;
};

type LogicBranch = {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
};

type ConnectDrag = {
  fromId: string;
  startCX: number;
  startCY: number;
  curX: number;
  curY: number;
};

type PendingDrop = {
  fromId: string;
  x: number;
  y: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_W = 176;
const NODE_H = 56;
const H_GAP = 220;

const PAGE_TYPE_BG: Record<PageType, string> = {
  cover: "bg-blue-100 text-blue-600",
  page: "bg-amber-100 text-amber-600",
  ending: "bg-rose-100 text-rose-600",
};

const PAGE_TYPE_LABEL: Record<PageType, string> = {
  cover: "Cover",
  page: "Form page",
  ending: "Ending",
};

const PAGE_TYPE_ICONS: Record<PageType, React.ReactNode> = {
  cover: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  page: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  ending: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const ADD_PAGE_OPTIONS: { type: PageType; label: string }[] = [
  { type: "page", label: "Form page" },
  { type: "cover", label: "Cover" },
  { type: "ending", label: "Ending" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeBranch(fromId: string, toId: string): LogicBranch {
  return { id: `${fromId}->${toId}`, fromId, toId };
}

function buildNodes(pages: FormSection[]): LogicNode[] {
  const source =
    pages.length > 0
      ? pages
      : [
          { id: "default-cover", title: "Cover", pageType: "cover" as const, fields: [] },
          { id: "default-page", title: "Page", pageType: "page" as const, fields: [] },
          { id: "default-ending", title: "Ending", pageType: "ending" as const, fields: [] },
        ];
  return source.map((p, i) => ({
    id: p.id,
    pageType: (p.pageType ?? "page") as PageType,
    title: p.title?.trim() || PAGE_TYPE_LABEL[(p.pageType ?? "page") as PageType],
    x: i * H_GAP,
    y: 0,
  }));
}

// ─── Connect Preview ──────────────────────────────────────────────────────────

function ConnectPreview({
  nodes,
  fromId,
  curX,
  curY,
  hasTarget,
}: {
  nodes: LogicNode[];
  fromId: string;
  curX: number;
  curY: number;
  hasTarget: boolean;
}) {
  const from = nodes.find((n) => n.id === fromId);
  if (!from) return null;
  const x1 = from.x + NODE_W;
  const y1 = from.y + NODE_H / 2;
  const cpOffset = Math.max(60, Math.abs(curX - x1) * 0.5);
  const d = `M ${x1} ${y1} C ${x1 + cpOffset} ${y1} ${curX - cpOffset} ${curY} ${curX} ${curY}`;
  return (
    <>
      <svg
        className="pointer-events-none"
        style={{ position: "absolute", left: -5000, top: -5000, width: 20000, height: 20000 }}
      >
        <g transform="translate(5000, 5000)">
          <path d={d} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 4" />
          {!hasTarget && <circle cx={curX} cy={curY} r="4" fill="#94a3b8" />}
        </g>
      </svg>
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

// ─── Drop Type Picker ─────────────────────────────────────────────────────────

function DropTypePicker({
  x,
  y,
  onSelect,
  onClose,
}: {
  x: number;
  y: number;
  onSelect: (t: PageType) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: PointerEvent) => {
      const el = document.getElementById("lm-drop-picker");
      if (el && !el.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [onClose]);

  return (
    <div
      id="lm-drop-picker"
      data-no-drag="true"
      className="absolute z-40 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 w-44"
      style={{ left: x, top: y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        Choose page type
      </p>
      {ADD_PAGE_OPTIONS.map((opt) => (
        <button
          key={opt.type}
          onClick={() => { onSelect(opt.type); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
        >
          <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${PAGE_TYPE_BG[opt.type]}`}>
            {PAGE_TYPE_ICONS[opt.type]}
          </span>
          <span className="text-xs font-semibold text-gray-800">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── SVG Connections ──────────────────────────────────────────────────────────

function ConnectionLines({ nodes, branches }: { nodes: LogicNode[]; branches: LogicBranch[] }) {
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <svg
      className="pointer-events-none"
      style={{ position: "absolute", left: -5000, top: -5000, width: 20000, height: 20000 }}
    >
      <defs>
        <marker id="lm-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path
            d="M0 0 L6 3 L0 6"
            fill="none"
            stroke="#6b7280"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <g transform="translate(5000, 5000)">
        {branches.map((b) => {
          const from = nodeMap[b.fromId];
          const to = nodeMap[b.toId];
          if (!from || !to) return null;

          const x1 = from.x + NODE_W;
          const y1 = from.y + NODE_H / 2;
          const x2 = to.x;
          const y2 = to.y + NODE_H / 2;
          const offset = Math.max(60, Math.abs(x2 - x1) * 0.4);
          const d = `M ${x1} ${y1} C ${x1 + offset} ${y1} ${x2 - offset} ${y2} ${x2} ${y2}`;

          return (
            <g key={b.id}>
              <path d={d} fill="none" stroke="#6b7280" strokeWidth="2" markerEnd="url(#lm-arrow)" />
              {b.label && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 6}
                  fontSize="10"
                  fill="#6b7280"
                  textAnchor="middle"
                  fontFamily="inherit"
                >
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ─── Node Context Menu ────────────────────────────────────────────────────────

function NodeContextMenu({
  x,
  y,
  isFirst,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  onSetFirstPage,
}: {
  x: number;
  y: number;
  isFirst: boolean;
  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetFirstPage: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const estH = isFirst ? 140 : 172;
  const adjustedY = y + estH > window.innerHeight ? Math.max(4, y - estH) : y;
  const adjustedX = Math.min(x, window.innerWidth - 184);

  useEffect(() => {
    const h = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.08 }}
      className="fixed z-[9999] bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.13)] border border-gray-100 py-1.5 w-44"
      style={{ left: adjustedX, top: adjustedY }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="py-1 space-y-0.5">
        <button onClick={onRename} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-left">
          <PencilSimpleIcon size={12} className="shrink-0 text-gray-400" />
          Rename
        </button>
        <button onClick={onDuplicate} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-left">
          <CopySimpleIcon size={12} className="shrink-0 text-gray-400" />
          Duplicate
        </button>
      </div>
      {!isFirst && (
        <>
          <div className="h-px bg-gray-100" />
          <div className="py-1">
            <button onClick={onSetFirstPage} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors text-left">
              <FlagPennantIcon size={12} weight="fill" className="shrink-0 text-blue-500" />
              Set as first page
            </button>
          </div>
        </>
      )}
      <div className="h-px bg-gray-100" />
      <div className="py-1">
        <button onClick={onDelete} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors text-left">
          <TrashSimpleIcon size={12} className="shrink-0" />
          Delete
        </button>
      </div>
    </motion.div>
  );
}

// ─── Add Page Dropdown ────────────────────────────────────────────────────────

function AddPageDropdown({ onSelect, onClose }: { onSelect: (t: PageType) => void; onClose: () => void }) {
  useEffect(() => {
    const h = (e: PointerEvent) => {
      const el = document.getElementById("lm-add-dropdown");
      if (el && !el.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [onClose]);

  return (
    <div
      id="lm-add-dropdown"
      className="absolute z-30 top-7 right-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 w-44"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        Choose page type
      </p>
      {ADD_PAGE_OPTIONS.map((opt) => (
        <button
          key={opt.type}
          onClick={() => { onSelect(opt.type); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
        >
          <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${PAGE_TYPE_BG[opt.type]}`}>
            {PAGE_TYPE_ICONS[opt.type]}
          </span>
          <span className="text-xs font-semibold text-gray-800">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Node Card ────────────────────────────────────────────────────────────────

function NodeCard({
  node,
  isFirst,
  isExpanded,
  isDropTarget,
  outBranches,
  nodesMap,
  onToggleExpand,
  onAddPage,
  onDeleteBranch,
  onStartConnectDrag,
  onContextMenuOpen,
  isRenaming,
  onRenameCommit,
}: {
  node: LogicNode;
  isFirst: boolean;
  isExpanded: boolean;
  isDropTarget: boolean;
  outBranches: LogicBranch[];
  nodesMap: Record<string, LogicNode>;
  onToggleExpand: () => void;
  onAddPage: (t: PageType) => void;
  onDeleteBranch: (branchId: string) => void;
  onStartConnectDrag: (e: React.PointerEvent, fromId: string) => void;
  onContextMenuOpen?: (x: number, y: number) => void;
  isRenaming?: boolean;
  onRenameCommit?: (title: string) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [renameValue, setRenameValue] = useState(node.title);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      setRenameValue(node.title);
      requestAnimationFrame(() => { renameRef.current?.focus(); renameRef.current?.select(); });
    }
  }, [isRenaming, node.title]);

  return (
    <div
      className={`bg-white border-2 rounded-xl shadow-sm overflow-visible transition-shadow ${
        isDropTarget
          ? "border-blue-400 ring-4 ring-blue-100"
          : isFirst
            ? "border-blue-400"
            : isExpanded
              ? "border-primary-400"
              : "border-gray-200"
      }`}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenuOpen?.(e.clientX, e.clientY); }}
    >
      {/* Start indicator */}
      {isFirst && (
        <div className="absolute -top-3.5 left-3 text-blue-500">
          <FlagPennantIcon size={14} weight="fill" />
        </div>
      )}

      {/* Main row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing select-none"
        onClick={onToggleExpand}
      >
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); onContextMenuOpen?.(r.left, r.bottom + 4); }}
          className="shrink-0 p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <DotsThreeVerticalIcon size={14} weight="bold" />
        </button>
        <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${PAGE_TYPE_BG[node.pageType]}`}>
          {PAGE_TYPE_ICONS[node.pageType]}
        </span>
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => onRenameCommit?.(renameValue)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRenameCommit?.(renameValue);
              if (e.key === "Escape") onRenameCommit?.(node.title);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-xs font-semibold text-gray-800 bg-white border border-primary-400 rounded px-1 outline-none min-w-0"
          />
        ) : (
          <span className="text-xs font-semibold text-gray-800 flex-1 truncate">{node.title}</span>
        )}

        {isExpanded && !isRenaming && (
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 shrink-0">
            DEFAULT
          </span>
        )}

        {/* + port button — drag to connect, click to add page (hidden for ending nodes) */}
        {node.pageType !== "ending" && (
          <div
            className="relative shrink-0"
            data-port="true"
            onPointerDown={(e) => { e.stopPropagation(); onStartConnectDrag(e, node.id); }}
            onClick={(e) => { e.stopPropagation(); setShowDropdown((v) => !v); }}
          >
            <button
              className="w-5 h-5 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors"
            >
              <PlusIcon size={11} weight="bold" />
            </button>
            {showDropdown && (
              <AddPageDropdown onSelect={onAddPage} onClose={() => setShowDropdown(false)} />
            )}
          </div>
        )}
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-3 py-2.5 space-y-1" onClick={(e) => e.stopPropagation()}>
          {outBranches.length === 0 && (
            <p className="text-[10px] text-gray-400 text-center py-1">No branches yet</p>
          )}
          {outBranches.map((branch) => {
            const isConditional = !!branch.label;
            const targetNode = nodesMap[branch.toId];
            return (
              <div key={branch.id} className="flex items-center gap-2 py-1">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  isConditional ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {isConditional ? "CONDITIONAL" : "DEFAULT"}
                </span>
                <span className="text-xs text-gray-600 flex-1 truncate">
                  {targetNode?.title ?? "Unknown"}
                </span>
                <button className="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <PencilSimpleIcon size={11} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteBranch(branch.id); }}
                  className="shrink-0 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                  title="Delete branch"
                >
                  <XIcon size={10} weight="bold" />
                </button>
              </div>
            );
          })}
          {node.pageType !== "ending" && (
            <button
              onClick={() => setShowDropdown(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary-600 transition-colors py-1 mt-0.5"
            >
              <PlusIcon size={11} weight="bold" />
              Add branch
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pages: FormSection[];
  id?: string;
  onSave?: () => void;
  onNodeMove?: (nodeId: string, x: number, y: number) => void;
  onRenamePage?: (id: string, title: string) => void;
  onDeletePage?: (id: string) => void;
  onDuplicatePage?: (id: string) => void;
  onSetFirstPage?: (id: string) => void;
};

export default function LogicModal({ isOpen, onClose, pages, onSave, onNodeMove, onRenamePage, onDeletePage, onDuplicatePage, onSetFirstPage }: Props) {
  const [nodes, setNodes] = useState<LogicNode[]>([]);
  const [branches, setBranches] = useState<LogicBranch[]>([]);
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [nodeMenu, setNodeMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 80, y: 200 });
  const [connectDrag, setConnectDrag] = useState<ConnectDrag | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ nodeId: string; ox: number; oy: number } | null>(null);
  const panDragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const connectDragRef = useRef<ConnectDrag | null>(null);
  const didDragRef = useRef(false);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;

  // Session-persistent state refs
  const savedPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const savedBranchesRef = useRef<LogicBranch[] | null>(null);
  const savedCustomNodesRef = useRef<LogicNode[]>([]);

  // ─── Zoom centered on viewport ───────────────────────────────────────────

  const zoomAtCenter = useCallback((newZoom: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      setZoom(newZoom);
      return;
    }
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const oldZoom = zoomRef.current;
    const oldPan = panRef.current;
    setZoom(newZoom);
    setPan({
      x: cx - (cx - oldPan.x) * (newZoom / oldZoom),
      y: cy - (cy - oldPan.y) * (newZoom / oldZoom),
    });
  }, []);

  // Initialize on open — restore positions from section settings, then session cache
  useEffect(() => {
    if (!isOpen) return;
    // Seed savedPositionsRef from explicit DB columns (logicX/logicY)
    for (const page of pages) {
      const lx = page.logicX;
      const ly = page.logicY;
      if (lx != null && ly != null) {
        savedPositionsRef.current.set(page.id, { x: lx, y: ly });
      }
    }
    const baseNodes = buildNodes(pages).map((node) => ({
      ...node,
      ...(savedPositionsRef.current.get(node.id) ?? {}),
    }));
    const customNodes = savedCustomNodesRef.current.map((node) => ({
      ...node,
      ...(savedPositionsRef.current.get(node.id) ?? {}),
    }));
    const allNodes = [...baseNodes, ...customNodes];
    setNodes(allNodes);
    setBranches(
      savedBranchesRef.current ??
        baseNodes.slice(0, -1).map((node, i) => makeBranch(node.id, baseNodes[i + 1].id)),
    );
    setExpandedNodeId(null);

    // Center nodes only if no saved positions exist
    const hasSaved = allNodes.some((node) => savedPositionsRef.current.has(node.id));
    if (!hasSaved) {
      requestAnimationFrame(() => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const totalW = baseNodes.length * H_GAP - (H_GAP - NODE_W);
        setPan({
          x: (rect.width - totalW) / 2,
          y: rect.height / 2 - NODE_H / 2,
        });
      });
    }
  }, [isOpen, pages]);

  // Keyboard zoom shortcuts + Ctrl+S
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        const next = Math.min(2, +(zoomRef.current + 0.1).toFixed(1));
        zoomAtCenter(next);
      } else if (e.key === "-") {
        e.preventDefault();
        const next = Math.max(0.3, +(zoomRef.current - 0.1).toFixed(1));
        zoomAtCenter(next);
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const ns = nodesRef.current;
          const totalW = ns.length * H_GAP - (H_GAP - NODE_W);
          setPan({ x: (rect.width - totalW) / 2, y: rect.height / 2 - NODE_H / 2 });
        }
      } else if (e.key === "s") {
        e.preventDefault();
        onSave?.();
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2500);
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [isOpen, onSave, zoomAtCenter]);

  // Native non-passive wheel listener to block browser Ctrl+scroll zoom
  useEffect(() => {
    if (!isOpen) return;
    const el = outerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [isOpen]);

  const startConnectDrag = useCallback(
    (e: React.PointerEvent, fromId: string) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left - panRef.current.x) / zoomRef.current;
      const y = (e.clientY - rect.top - panRef.current.y) / zoomRef.current;
      connectDragRef.current = { fromId, startCX: e.clientX, startCY: e.clientY, curX: x, curY: y };
      outerRef.current?.setPointerCapture(e.pointerId);
    },
    [],
  );

  const deleteBranch = useCallback((branchId: string) => {
    setBranches((prev) => {
      const b = prev.filter((br) => br.id !== branchId);
      savedBranchesRef.current = b;
      return b;
    });
  }, []);

  const addNodeFrom = useCallback(
    (fromId: string, type: PageType, pos?: { x: number; y: number }) => {
      const fromNode = nodesRef.current.find((n) => n.id === fromId);
      if (!fromNode) return;
      const newId = `node-${Date.now()}`;
      const newNode: LogicNode = {
        id: newId,
        pageType: type,
        title: PAGE_TYPE_LABEL[type],
        x: pos?.x ?? fromNode.x + H_GAP,
        y: pos?.y ?? fromNode.y,
      };
      savedCustomNodesRef.current = [...savedCustomNodesRef.current, newNode];
      savedPositionsRef.current.set(newId, { x: newNode.x, y: newNode.y });
      setNodes((prev) => [...prev, newNode]);
      setBranches((prev) => {
        const b = [...prev, makeBranch(fromId, newId)];
        savedBranchesRef.current = b;
        return b;
      });
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;

      // Ignore clicks inside non-draggable areas (dropdowns, port buttons)
      if (target.closest("[data-no-drag]")) return;
      // Port div: stop pointer from starting a canvas pan/node drag
      if (target.closest("[data-port]")) return;

      const nodeEl = target.closest<HTMLElement>("[data-nodeid]");

      if (!nodeEl) {
        // Start canvas pan
        panDragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      const nodeId = nodeEl.dataset.nodeid!;
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (!node) return;

      didDragRef.current = false;
      const rect = canvasRef.current!.getBoundingClientRect();
      dragRef.current = {
        nodeId,
        ox: (e.clientX - rect.left - pan.x) / zoom - node.x,
        oy: (e.clientY - rect.top - pan.y) / zoom - node.y,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pan, zoom],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragRef.current) {
        didDragRef.current = true;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / zoom - dragRef.current.ox;
        const y = (e.clientY - rect.top - pan.y) / zoom - dragRef.current.oy;
        const nodeId = dragRef.current.nodeId;
        savedPositionsRef.current.set(nodeId, { x, y });
        setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n)));
        return;
      }
      if (connectDragRef.current) {
        const dx = e.clientX - connectDragRef.current.startCX;
        const dy = e.clientY - connectDragRef.current.startCY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          const rect = canvasRef.current!.getBoundingClientRect();
          const updated: ConnectDrag = {
            ...connectDragRef.current,
            curX: (e.clientX - rect.left - pan.x) / zoom,
            curY: (e.clientY - rect.top - pan.y) / zoom,
          };
          connectDragRef.current = updated;
          setConnectDrag({ ...updated });
          // Detect hover target for highlight
          const elAtPoint = document.elementFromPoint(e.clientX, e.clientY);
          const hoveredNodeEl = elAtPoint?.closest<HTMLElement>("[data-nodeid]");
          const hoveredId = hoveredNodeEl?.dataset.nodeid ?? null;
          setDropTargetId(hoveredId !== connectDragRef.current.fromId ? hoveredId : null);
        }
        return;
      }
      if (panDragRef.current) {
        const dx = e.clientX - panDragRef.current.sx;
        const dy = e.clientY - panDragRef.current.sy;
        setPan({ x: panDragRef.current.px + dx, y: panDragRef.current.py + dy });
      }
    },
    [pan, zoom],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (connectDragRef.current) {
        const { fromId, startCX, startCY, curX, curY } = connectDragRef.current;
        const moved =
          Math.abs(e.clientX - startCX) > 4 || Math.abs(e.clientY - startCY) > 4;
        if (moved) {
          const elAtPoint = document.elementFromPoint(e.clientX, e.clientY);
          const targetNodeEl = elAtPoint?.closest<HTMLElement>("[data-nodeid]");
          const targetId = targetNodeEl?.dataset.nodeid;
          if (targetId && targetId !== fromId) {
            // Connect to existing node
            const branchId = `${fromId}->${targetId}`;
            const alreadyExists = nodesRef.current && branches.some((b) => b.id === branchId);
            if (!alreadyExists) {
              setBranches((prev) => {
                const b = [...prev, makeBranch(fromId, targetId)];
                savedBranchesRef.current = b;
                return b;
              });
            }
          } else if (!targetNodeEl) {
            // Show type picker at drop position
            setPendingDrop({ fromId, x: curX, y: curY });
          }
        }
        connectDragRef.current = null;
        setConnectDrag(null);
        setDropTargetId(null);
        return;
      }
      if (dragRef.current) {
        const pos = savedPositionsRef.current.get(dragRef.current.nodeId);
        if (pos) onNodeMove?.(dragRef.current.nodeId, pos.x, pos.y);
      }
      dragRef.current = null;
      panDragRef.current = null;
    },
    [addNodeFrom, branches, onNodeMove],
  );

  const handleNodeToggle = useCallback((nodeId: string) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setExpandedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  // Ctrl+wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const next = Math.min(2, Math.max(0.3, +(zoomRef.current + delta).toFixed(1)));
      // Zoom toward mouse cursor
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) { setZoom(next); return; }
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const oldZoom = zoomRef.current;
      const oldPan = panRef.current;
      setZoom(next);
      setPan({
        x: cx - (cx - oldPan.x) * (next / oldZoom),
        y: cy - (cy - oldPan.y) * (next / oldZoom),
      });
    },
    [],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className="w-[90vw] h-[90vh] bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="h-12 flex items-center justify-between px-4 shrink-0 bg-white z-10">
              <div className="flex-1" />
              <span className="text-sm font-semibold text-gray-800">Page logic</span>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <XIcon size={16} weight="bold" />
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div
              ref={outerRef}
              className="flex-1 relative overflow-hidden mx-4 mb-4 rounded-xl cursor-grab active:cursor-grabbing"
              style={{
                backgroundImage: "radial-gradient(circle, #d1d5db 2px, transparent 2px)",
                backgroundSize: "28px 28px",
                backgroundColor: "#f9fafb",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
            >
              {/* Inset canvas area — gives breathing room from modal edge */}
              <div ref={canvasRef} className="absolute inset-3">
                {/* World container */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 0,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "0 0",
                  }}
                >
                  <ConnectionLines nodes={nodes} branches={branches} />

                  {connectDrag && (
                    <ConnectPreview
                      nodes={nodes}
                      fromId={connectDrag.fromId}
                      curX={connectDrag.curX}
                      curY={connectDrag.curY}
                      hasTarget={dropTargetId !== null}
                    />
                  )}

                  {pendingDrop && (
                    <DropTypePicker
                      x={pendingDrop.x}
                      y={pendingDrop.y}
                      onSelect={(type) => {
                        addNodeFrom(pendingDrop.fromId, type, {
                          x: pendingDrop.x - NODE_W / 2,
                          y: pendingDrop.y - NODE_H / 2,
                        });
                        setPendingDrop(null);
                      }}
                      onClose={() => setPendingDrop(null)}
                    />
                  )}

                  {(() => {
                    const nodesMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
                    return nodes.map((node, idx) => (
                      <div
                        key={node.id}
                        data-nodeid={node.id}
                        style={{
                          position: "absolute",
                          left: node.x,
                          top: node.y,
                          width: NODE_W,
                        }}
                      >
                        <NodeCard
                          node={node}
                          isFirst={idx === 0}
                          isExpanded={expandedNodeId === node.id}
                          isDropTarget={dropTargetId === node.id}
                          outBranches={branches.filter((b) => b.fromId === node.id)}
                          nodesMap={nodesMap}
                          onToggleExpand={() => handleNodeToggle(node.id)}
                          onAddPage={(type) => addNodeFrom(node.id, type)}
                          onDeleteBranch={deleteBranch}
                          onStartConnectDrag={startConnectDrag}
                          onContextMenuOpen={(x, y) => setNodeMenu({ nodeId: node.id, x, y })}
                          isRenaming={renamingNodeId === node.id}
                          onRenameCommit={(title) => {
                            if (title.trim()) {
                              setNodes((prev) => prev.map((n) => n.id === node.id ? { ...n, title: title.trim() } : n));
                              onRenamePage?.(node.id, title.trim());
                            }
                            setRenamingNodeId(null);
                          }}
                        />
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Zoom controls */}
              <div data-no-drag="true" className="absolute bottom-4 left-4 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden z-10">
                <button
                  onClick={() => zoomAtCenter(Math.min(2, +(zoom + 0.1).toFixed(1)))}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors border-b border-gray-100"
                  title="Zoom in (Ctrl++)"
                >
                  <MagnifyingGlassPlusIcon size={16} />
                </button>
                <button
                  onClick={() => zoomAtCenter(Math.max(0.3, +(zoom - 0.1).toFixed(1)))}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors border-b border-gray-100"
                  title="Zoom out (Ctrl+-)"
                >
                  <MagnifyingGlassMinusIcon size={16} />
                </button>
                <button
                  onClick={() => {
                    setZoom(1);
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                      const ns = nodesRef.current;
                      const totalW = ns.length * H_GAP - (H_GAP - NODE_W);
                      setPan({ x: (rect.width - totalW) / 2, y: rect.height / 2 - NODE_H / 2 });
                    }
                  }}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors border-b border-gray-100"
                  title="Reset zoom (Ctrl+0)"
                >
                  <ArrowsOutIcon size={16} />
                </button>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[10px] font-bold">{Math.round(zoom * 100)}%</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Node context menu */}
          <AnimatePresence>
            {nodeMenu !== null && (() => {
              const menuIdx = nodes.findIndex((n) => n.id === nodeMenu.nodeId);
              if (menuIdx < 0) return null;
              return (
                <NodeContextMenu
                  key="node-ctx"
                  x={nodeMenu.x}
                  y={nodeMenu.y}
                  isFirst={menuIdx === 0}
                  onClose={() => setNodeMenu(null)}
                  onRename={() => { setRenamingNodeId(nodeMenu.nodeId); setNodeMenu(null); }}
                  onDuplicate={() => { onDuplicatePage?.(nodeMenu.nodeId); setNodeMenu(null); }}
                  onDelete={() => {
                    onDeletePage?.(nodeMenu.nodeId);
                    setNodes((prev) => prev.filter((n) => n.id !== nodeMenu.nodeId));
                    setBranches((prev) => { const b = prev.filter((br) => br.fromId !== nodeMenu.nodeId && br.toId !== nodeMenu.nodeId); savedBranchesRef.current = b; return b; });
                    setNodeMenu(null);
                  }}
                  onSetFirstPage={() => { onSetFirstPage?.(nodeMenu.nodeId); setNodeMenu(null); }}
                />
              );
            })()}
          </AnimatePresence>

          {/* Save toast */}
          <AnimatePresence>
            {saveToast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-gray-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg pointer-events-none"
              >
                <FloppyDiskIcon size={12} weight="bold" className="text-emerald-400" />
                Saved
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
