import { useCallback, useEffect, useRef, useState } from "react";
import type { FormSection } from "@/types/form";
import { buildRuntimePageLogicBranches } from "@/utils/form/pageLogic";
import type { LogicModalRequestedTab } from "@/utils/form/logicModalEvents";
import {
  H_GAP,
  NODE_H,
  NODE_W,
  PAGE_TYPE_LABEL,
  buildNodes,
  connectBranchTarget,
  makeConditionalBranchId,
  matchesBranchIdentity,
  mergeMissingConditionalBranches,
  normalizeLogicBranches,
  type ConnectionMode,
  type ConnectDrag,
  type LogicBranch,
  type LogicNode,
  type PageType,
  type PendingDrop,
} from "@/components/builder/modals/logicModalPageLogic.shared";

type UseLogicModalPageLogicArgs = {
  activeTab: LogicModalRequestedTab;
  isOpen: boolean;
  onAddPage?: (
    type: PageType,
  ) => string | Promise<string | undefined> | undefined;
  onDeletePage?: (id: string) => void;
  onFlowChange?: (branches: LogicBranch[]) => void;
  onNodeMove?: (nodeId: string, x: number, y: number) => void;
  onRenamePage?: (id: string, title: string) => void;
  pages: FormSection[];
};

export type LogicModalPageLogicController = {
  addConditionalSlot: (fromId: string) => void;
  addNodeFrom: (
    fromId: string,
    type: PageType,
    position?: { x: number; y: number },
    mode?: ConnectionMode,
    branchId?: string,
  ) => Promise<void>;
  activeConditionBranch: LogicBranch | null;
  branchHintToast: boolean;
  branches: LogicBranch[];
  canvasRef: React.RefObject<HTMLDivElement | null>;
  clearPendingDrop: () => void;
  closeBranchConditionEditor: () => void;
  closeConfirmDeleteNode: () => void;
  closeNodeMenu: () => void;
  conditionEditorAnchorEl: HTMLElement | null;
  conditionEditorBranchId: string | null;
  confirmDeleteNodeId: string | null;
  connectDrag: ConnectDrag | null;
  deleteBranch: (
    target:
      | string
      | {
          id?: string;
          fromId: string;
          toId: string;
          isConditional?: boolean;
        },
  ) => void;
  dropTargetId: string | null;
  expandedNodeId: string | null;
  handleConfirmDeleteNode: () => void;
  handleNodeRenameCommit: (nodeId: string, title: string) => void;
  handleNodeToggle: (nodeId: string) => void;
  handlePendingDropSelect: (type: PageType) => Promise<void>;
  handlePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  hoveredBranchId: string | null;
  nodeMenu: { nodeId: string; x: number; y: number } | null;
  nodes: LogicNode[];
  openBranchConditionEditor: (branchId: string, anchorEl: HTMLElement) => void;
  outerRef: React.RefObject<HTMLDivElement | null>;
  pan: { x: number; y: number };
  pendingDrop: PendingDrop | null;
  prepareForTabChange: () => void;
  renamingNodeId: string | null;
  requestDeleteNode: (nodeId: string) => void;
  resetZoom: () => void;
  setHoveredBranchId: (id: string | null) => void;
  setNodeMenu: (menu: { nodeId: string; x: number; y: number } | null) => void;
  setRenamingNodeId: (nodeId: string | null) => void;
  startConnectDrag: (
    event: React.PointerEvent,
    fromId: string,
    mode: ConnectionMode,
    branchId?: string,
    startY?: number,
  ) => void;
  updateBranchCondition: (
    branchId: string,
    updates: Pick<LogicBranch, "conditionTree">,
  ) => void;
  zoom: number;
  zoomAtCenter: (newZoom: number) => void;
};

export function useLogicModalPageLogic({
  activeTab,
  isOpen,
  onAddPage,
  onDeletePage,
  onFlowChange,
  onNodeMove,
  onRenamePage,
  pages,
}: UseLogicModalPageLogicArgs): LogicModalPageLogicController {
  const [nodes, setNodes] = useState<LogicNode[]>([]);
  const [branches, setBranches] = useState<LogicBranch[]>([]);
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [nodeMenu, setNodeMenu] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);
  const [confirmDeleteNodeId, setConfirmDeleteNodeId] = useState<string | null>(
    null,
  );
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 80, y: 200 });
  const [connectDrag, setConnectDrag] = useState<ConnectDrag | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const [hoveredBranchId, setHoveredBranchId] = useState<string | null>(null);
  const [branchHintToast, setBranchHintToast] = useState(false);
  const [conditionEditorBranchId, setConditionEditorBranchId] = useState<
    string | null
  >(null);
  const [conditionEditorAnchorEl, setConditionEditorAnchorEl] =
    useState<HTMLElement | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ nodeId: string; ox: number; oy: number } | null>(
    null,
  );
  const panDragRef = useRef<{
    sx: number;
    sy: number;
    px: number;
    py: number;
  } | null>(null);
  const connectDragRef = useRef<ConnectDrag | null>(null);
  const branchHintTimeoutRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const nodesRef = useRef(nodes);
  const branchesRef = useRef(branches);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);

  const savedPositionsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );
  const savedBranchesRef = useRef<LogicBranch[] | null>(null);
  const userInteractedRef = useRef(false);
  const skipFlowSyncRef = useRef(false);
  const lastSyncedBranchesRef = useRef<LogicBranch[] | null>(null);
  const flowSyncTimeoutRef = useRef<number | null>(null);
  const didOpenRef = useRef(false);
  const hasHydratedGraphRef = useRef(false);

  const activeConditionBranch = conditionEditorBranchId
    ? (branches.find((branch) => branch.id === conditionEditorBranchId) ?? null)
    : null;

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    branchesRef.current = branches;
  }, [branches]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const updateBranches = useCallback(
    (updater: LogicBranch[] | ((prev: LogicBranch[]) => LogicBranch[])) => {
      userInteractedRef.current = true;
      setBranches((prev) => {
        const next = normalizeLogicBranches(
          typeof updater === "function" ? updater(prev) : updater,
        );
        savedBranchesRef.current = next;
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (branchHintTimeoutRef.current) {
        window.clearTimeout(branchHintTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (!hasHydratedGraphRef.current) return;
    if (!userInteractedRef.current) return;
    if (skipFlowSyncRef.current) {
      skipFlowSyncRef.current = false;
      lastSyncedBranchesRef.current = branches;
      return;
    }
    if (lastSyncedBranchesRef.current === branches) return;

    lastSyncedBranchesRef.current = branches;
    if (flowSyncTimeoutRef.current) {
      window.clearTimeout(flowSyncTimeoutRef.current);
    }

    flowSyncTimeoutRef.current = window.setTimeout(() => {
      onFlowChange?.(branches);
      flowSyncTimeoutRef.current = null;
    }, 0);

    return () => {
      if (flowSyncTimeoutRef.current) {
        window.clearTimeout(flowSyncTimeoutRef.current);
        flowSyncTimeoutRef.current = null;
      }
    };
  }, [branches, isOpen, onFlowChange]);

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

  const resetZoom = useCallback(() => {
    setZoom(1);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const totalW = nodesRef.current.length * H_GAP - (H_GAP - NODE_W);
    setPan({
      x: (rect.width - totalW) / 2,
      y: rect.height / 2 - NODE_H / 2,
    });
  }, []);

  const syncGraphFromPages = useCallback(
    (
      incomingPages: FormSection[],
      options?: { resetExpanded?: boolean; centerIfNeeded?: boolean },
    ) => {
      for (const page of incomingPages) {
        if (page.logicX != null && page.logicY != null) {
          savedPositionsRef.current.set(page.id, {
            x: page.logicX,
            y: page.logicY,
          });
        }
      }

      const baseNodes = buildNodes(incomingPages);

      setNodes((prev) => {
        const prevById = new Map(prev.map((node) => [node.id, node]));
        return baseNodes.map((node) => {
          const savedPosition = savedPositionsRef.current.get(node.id);
          const previousNode = prevById.get(node.id);
          return {
            ...node,
            ...(savedPosition ??
              (previousNode ? { x: previousNode.x, y: previousNode.y } : {})),
          };
        });
      });

      let nextBranches = normalizeLogicBranches(
        buildRuntimePageLogicBranches(incomingPages),
      );

      if (!options?.resetExpanded) {
        nextBranches = mergeMissingConditionalBranches(
          nextBranches,
          branchesRef.current,
          incomingPages,
        );
      }

      savedBranchesRef.current = nextBranches;
      skipFlowSyncRef.current = true;
      lastSyncedBranchesRef.current = nextBranches;
      hasHydratedGraphRef.current = true;
      userInteractedRef.current = false;
      setBranches((prev) =>
        JSON.stringify(prev) === JSON.stringify(nextBranches) ? prev : nextBranches,
      );

      if (options?.resetExpanded) {
        setExpandedNodeId(null);
      }

      if (options?.centerIfNeeded) {
        const hasSaved = baseNodes.some((node) =>
          savedPositionsRef.current.has(node.id),
        );
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
      }
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      didOpenRef.current = false;
      hasHydratedGraphRef.current = false;
      setNodeMenu(null);
      setConfirmDeleteNodeId(null);
      setConditionEditorBranchId(null);
      setConditionEditorAnchorEl(null);
      setPendingDrop(null);
      return;
    }

    const isInitialOpen = !didOpenRef.current;
    didOpenRef.current = true;
    hasHydratedGraphRef.current = false;
    syncGraphFromPages(pages, {
      resetExpanded: isInitialOpen,
      centerIfNeeded: isInitialOpen,
    });
  }, [isOpen, pages, syncGraphFromPages]);

  useEffect(() => {
    if (!isOpen || activeTab !== "pageLogic") return;

    const handler = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;

      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!outerRef.current?.contains(target)) return;

      event.preventDefault();
    };

    window.addEventListener("wheel", handler, {
      passive: false,
      capture: true,
    });

    return () =>
      window.removeEventListener("wheel", handler, {
        capture: true,
      });
  }, [activeTab, isOpen]);

  const startConnectDrag = useCallback(
    (
      event: React.PointerEvent,
      fromId: string,
      mode: ConnectionMode,
      branchId?: string,
      startY?: number,
    ) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (event.clientX - rect.left - panRef.current.x) / zoomRef.current;
      const y = (event.clientY - rect.top - panRef.current.y) / zoomRef.current;
      connectDragRef.current = {
        fromId,
        mode,
        branchId,
        startY,
        startCX: event.clientX,
        startCY: event.clientY,
        curX: x,
        curY: y,
      };
      outerRef.current?.setPointerCapture(event.pointerId);
    },
    [],
  );

  const closeBranchConditionEditor = useCallback(() => {
    setConditionEditorBranchId(null);
    setConditionEditorAnchorEl(null);
  }, []);

  const deleteBranch = useCallback(
    (
      target:
        | string
        | {
            id?: string;
            fromId: string;
            toId: string;
            isConditional?: boolean;
          },
    ) => {
      const normalizedBranchId =
        typeof target === "string" ? target : target.id?.trim() || null;

      if (
        normalizedBranchId &&
        conditionEditorBranchId === normalizedBranchId
      ) {
        closeBranchConditionEditor();
      }

      updateBranches((prev) =>
        prev.filter(
          (branch, branchIndex) =>
            !matchesBranchIdentity(branch, branchIndex, target),
        ),
      );
    },
    [closeBranchConditionEditor, conditionEditorBranchId, updateBranches],
  );

  const announceBranching = useCallback((nodeId: string) => {
    setExpandedNodeId(nodeId);
    setBranchHintToast(true);
    if (branchHintTimeoutRef.current) {
      window.clearTimeout(branchHintTimeoutRef.current);
    }
    branchHintTimeoutRef.current = window.setTimeout(() => {
      setBranchHintToast(false);
      branchHintTimeoutRef.current = null;
    }, 2500);
  }, []);

  const addNodeFrom = useCallback(
    async (
      fromId: string,
      type: PageType,
      position?: { x: number; y: number },
      mode: ConnectionMode = "default",
      branchId?: string,
    ) => {
      const fromNode = nodesRef.current.find((node) => node.id === fromId);
      if (!fromNode) return;

      const realId = await onAddPage?.(type);
      if (onAddPage && !realId) return;

      const newId = realId ?? `node-${Date.now()}`;
      const newNode: LogicNode = {
        id: newId,
        pageType: type,
        title: PAGE_TYPE_LABEL[type],
        x: position?.x ?? fromNode.x + H_GAP,
        y: position?.y ?? fromNode.y,
      };

      const existingDefault = branchesRef.current.find(
        (branch) =>
          branch.fromId === fromId && !branch.isConditional && branch.toId,
      );
      const willCreateConditional =
        mode === "default" &&
        !!existingDefault &&
        existingDefault.toId !== newId;

      savedPositionsRef.current.set(newId, { x: newNode.x, y: newNode.y });
      setNodes((prev) => [...prev, newNode]);
      updateBranches((prev) =>
        connectBranchTarget(prev, fromId, newId, mode, branchId),
      );

      if (willCreateConditional) {
        announceBranching(fromId);
      }
    },
    [announceBranching, onAddPage, updateBranches],
  );

  const addConditionalSlot = useCallback(
    (fromId: string) => {
      const slotId = makeConditionalBranchId(fromId);
      updateBranches((prev) => [
        ...prev,
        { id: slotId, fromId, toId: "", isConditional: true },
      ]);
      announceBranching(fromId);
    },
    [announceBranching, updateBranches],
  );

  const handlePendingDropSelect = useCallback(
    async (type: PageType) => {
      if (!pendingDrop) return;

      await addNodeFrom(
        pendingDrop.fromId,
        type,
        {
          x: pendingDrop.x - NODE_W / 2,
          y: pendingDrop.y - NODE_H / 2,
        },
        pendingDrop.mode,
        pendingDrop.branchId,
      );
      setPendingDrop(null);
    },
    [addNodeFrom, pendingDrop],
  );

  const clearPendingDrop = useCallback(() => {
    setPendingDrop(null);
  }, []);

  const openBranchConditionEditor = useCallback(
    (branchId: string, anchorEl: HTMLElement) => {
      setConditionEditorBranchId(branchId);
      setConditionEditorAnchorEl(anchorEl);
    },
    [],
  );

  const updateBranchCondition = useCallback(
    (branchId: string, updates: Pick<LogicBranch, "conditionTree">) => {
      updateBranches((prev) =>
        prev.map((branch) =>
          branch.id === branchId
            ? {
                ...branch,
                ...updates,
                label: undefined,
              }
            : branch,
        ),
      );
    },
    [updateBranches],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;

      if (target.closest("[data-no-drag]")) return;
      if (target.closest("[data-port]")) return;

      const nodeElement = target.closest<HTMLElement>("[data-nodeid]");

      if (!nodeElement) {
        panDragRef.current = {
          sx: event.clientX,
          sy: event.clientY,
          px: panRef.current.x,
          py: panRef.current.y,
        };
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        return;
      }

      const nodeId = nodeElement.dataset.nodeid!;
      const node = nodesRef.current.find((item) => item.id === nodeId);
      if (!node) return;

      didDragRef.current = false;
      const rect = canvasRef.current!.getBoundingClientRect();
      dragRef.current = {
        nodeId,
        ox: (event.clientX - rect.left - panRef.current.x) / zoomRef.current - node.x,
        oy: (event.clientY - rect.top - panRef.current.y) / zoomRef.current - node.y,
      };
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragRef.current) {
        didDragRef.current = true;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x =
          (event.clientX - rect.left - panRef.current.x) / zoomRef.current -
          dragRef.current.ox;
        const y =
          (event.clientY - rect.top - panRef.current.y) / zoomRef.current -
          dragRef.current.oy;
        const nodeId = dragRef.current.nodeId;
        savedPositionsRef.current.set(nodeId, { x, y });
        setNodes((prev) =>
          prev.map((node) => (node.id === nodeId ? { ...node, x, y } : node)),
        );
        return;
      }

      if (connectDragRef.current) {
        const dx = event.clientX - connectDragRef.current.startCX;
        const dy = event.clientY - connectDragRef.current.startCY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          const rect = canvasRef.current!.getBoundingClientRect();
          const updated: ConnectDrag = {
            ...connectDragRef.current,
            curX:
              (event.clientX - rect.left - panRef.current.x) / zoomRef.current,
            curY:
              (event.clientY - rect.top - panRef.current.y) / zoomRef.current,
          };
          connectDragRef.current = updated;
          setConnectDrag({ ...updated });
          const elementAtPoint = document.elementFromPoint(
            event.clientX,
            event.clientY,
          );
          const hoveredNodeElement =
            elementAtPoint?.closest<HTMLElement>("[data-nodeid]");
          const hoveredId = hoveredNodeElement?.dataset.nodeid ?? null;
          setDropTargetId(
            hoveredId !== connectDragRef.current.fromId ? hoveredId : null,
          );
        }
        return;
      }

      if (panDragRef.current) {
        const dx = event.clientX - panDragRef.current.sx;
        const dy = event.clientY - panDragRef.current.sy;
        setPan({
          x: panDragRef.current.px + dx,
          y: panDragRef.current.py + dy,
        });
      }
    },
    [],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (connectDragRef.current) {
        const {
          fromId,
          mode,
          branchId: slotId,
          startCX,
          startCY,
          curX,
          curY,
        } = connectDragRef.current;
        const moved =
          Math.abs(event.clientX - startCX) > 4 ||
          Math.abs(event.clientY - startCY) > 4;
        if (moved) {
          const elementAtPoint = document.elementFromPoint(
            event.clientX,
            event.clientY,
          );
          const targetNodeElement =
            elementAtPoint?.closest<HTMLElement>("[data-nodeid]");
          const targetId = targetNodeElement?.dataset.nodeid;
          if (targetId && targetId !== fromId) {
            const existingDefault = branchesRef.current.find(
              (branch) =>
                branch.fromId === fromId &&
                !branch.isConditional &&
                branch.toId,
            );
            const willCreateConditional =
              mode === "default" &&
              !!existingDefault &&
              existingDefault.toId !== targetId;
            updateBranches((prev) =>
              connectBranchTarget(prev, fromId, targetId, mode, slotId),
            );
            if (willCreateConditional) {
              announceBranching(fromId);
            }
          } else if (!targetNodeElement) {
            setPendingDrop({
              fromId,
              mode,
              branchId: slotId,
              x: curX,
              y: curY,
            });
          }
        }
        connectDragRef.current = null;
        setConnectDrag(null);
        setDropTargetId(null);
        return;
      }

      if (dragRef.current) {
        const position = savedPositionsRef.current.get(dragRef.current.nodeId);
        if (position) onNodeMove?.(dragRef.current.nodeId, position.x, position.y);
      }

      dragRef.current = null;
      panDragRef.current = null;
    },
    [announceBranching, onNodeMove, updateBranches],
  );

  const handleNodeToggle = useCallback((nodeId: string) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setExpandedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const next = Math.min(
      2,
      Math.max(0.3, +(zoomRef.current + delta).toFixed(1)),
    );
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      setZoom(next);
      return;
    }
    const cx = event.clientX - rect.left;
    const cy = event.clientY - rect.top;
    const oldZoom = zoomRef.current;
    const oldPan = panRef.current;
    setZoom(next);
    setPan({
      x: cx - (cx - oldPan.x) * (next / oldZoom),
      y: cy - (cy - oldPan.y) * (next / oldZoom),
    });
  }, []);

  const closeNodeMenu = useCallback(() => {
    setNodeMenu(null);
  }, []);

  const requestDeleteNode = useCallback((nodeId: string) => {
    setConfirmDeleteNodeId(nodeId);
    setNodeMenu(null);
  }, []);

  const closeConfirmDeleteNode = useCallback(() => {
    setConfirmDeleteNodeId(null);
  }, []);

  const handleNodeRenameCommit = useCallback(
    (nodeId: string, title: string) => {
      if (title.trim()) {
        setNodes((prev) =>
          prev.map((node) =>
            node.id === nodeId ? { ...node, title: title.trim() } : node,
          ),
        );
        onRenamePage?.(nodeId, title.trim());
      }
      setRenamingNodeId(null);
    },
    [onRenamePage],
  );

  const handleConfirmDeleteNode = useCallback(() => {
    if (!confirmDeleteNodeId) return;

    const node = nodesRef.current.find((item) => item.id === confirmDeleteNodeId);
    if (node?.pageType === "ending") {
      const endingCount = nodesRef.current.filter(
        (item) => item.pageType === "ending",
      ).length;
      if (endingCount <= 1) {
        onDeletePage?.(confirmDeleteNodeId);
        setConfirmDeleteNodeId(null);
        return;
      }
    }

    onDeletePage?.(confirmDeleteNodeId);
    setNodes((prev) => prev.filter((node) => node.id !== confirmDeleteNodeId));
    updateBranches((prev) =>
      prev.flatMap((branch) => {
        if (branch.fromId === confirmDeleteNodeId) {
          return [];
        }

        if (branch.toId !== confirmDeleteNodeId) {
          return [branch];
        }

        if (!branch.isConditional) {
          return [{ ...branch, toId: "" }];
        }

        return [];
      }),
    );

    if (renamingNodeId === confirmDeleteNodeId) {
      setRenamingNodeId(null);
    }
    if (expandedNodeId === confirmDeleteNodeId) {
      setExpandedNodeId(null);
    }

    closeConfirmDeleteNode();
  }, [
    closeConfirmDeleteNode,
    confirmDeleteNodeId,
    expandedNodeId,
    onDeletePage,
    renamingNodeId,
    updateBranches,
  ]);

  const prepareForTabChange = useCallback(() => {
    closeNodeMenu();
    closeConfirmDeleteNode();
    closeBranchConditionEditor();
  }, [closeBranchConditionEditor, closeConfirmDeleteNode, closeNodeMenu]);

  return {
    addConditionalSlot,
    addNodeFrom,
    activeConditionBranch,
    branchHintToast,
    branches,
    canvasRef,
    clearPendingDrop,
    closeBranchConditionEditor,
    closeConfirmDeleteNode,
    closeNodeMenu,
    conditionEditorAnchorEl,
    conditionEditorBranchId,
    confirmDeleteNodeId,
    connectDrag,
    deleteBranch,
    dropTargetId,
    expandedNodeId,
    handleConfirmDeleteNode,
    handleNodeRenameCommit,
    handleNodeToggle,
    handlePendingDropSelect,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    hoveredBranchId,
    nodeMenu,
    nodes,
    openBranchConditionEditor,
    outerRef,
    pan,
    pendingDrop,
    prepareForTabChange,
    renamingNodeId,
    requestDeleteNode,
    resetZoom,
    setHoveredBranchId,
    setNodeMenu,
    setRenamingNodeId,
    startConnectDrag,
    updateBranchCondition,
    zoom,
    zoomAtCenter,
  };
}
