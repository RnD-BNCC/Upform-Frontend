import { ConfirmModal } from "@/components/modal";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowsOutIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from "@phosphor-icons/react";
import type { FormSection } from "@/types/form";
import { getAvailableConditionFieldsForSection } from "@/utils/form";
import BranchConditionPopover from "./BranchConditionPopover";
import {
  ConnectPreview,
  ConnectionLines,
  DropTypePicker,
  NodeCard,
  NodeContextMenu,
} from "./LogicModalPageLogicPrimitives";
import type { PageType } from "./logicModalPageLogic.shared";
import { NODE_W, getLogicNodeKey } from "./logicModalPageLogic.shared";
import type { LogicModalPageLogicController } from "@/hooks/builder/useLogicModalPageLogic";

type Props = {
  controller: LogicModalPageLogicController;
  onDuplicatePage?: (id: string) => void;
  onSetFirstPage?: (id: string) => void;
  pages: FormSection[];
};

export default function LogicModalPageLogicView({
  controller,
  onDuplicatePage,
  onSetFirstPage,
  pages,
}: Props) {
  const {
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
  } = controller;

  const activeConditionFields = activeConditionBranch
    ? getAvailableConditionFieldsForSection(pages, activeConditionBranch.fromId)
    : [];

  return (
    <>
      <div
        ref={outerRef}
        className="relative mx-4 mb-4 flex-1 overflow-hidden rounded-xl cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage:
            "radial-gradient(circle, #d1d5db 2px, transparent 2px)",
          backgroundSize: "28px 28px",
          backgroundColor: "#f9fafb",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <div ref={canvasRef} className="absolute inset-3">
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
            <ConnectionLines
              nodes={nodes}
              branches={branches}
              hoveredBranchId={hoveredBranchId}
              onHoverBranch={setHoveredBranchId}
              onDeleteBranch={deleteBranch}
            />

            {connectDrag ? (
              <ConnectPreview
                nodes={nodes}
                fromId={connectDrag.fromId}
                startY={connectDrag.startY}
                curX={connectDrag.curX}
                curY={connectDrag.curY}
                hasTarget={dropTargetId !== null}
              />
            ) : null}

            {pendingDrop ? (
              <DropTypePicker
                x={pendingDrop.x}
                y={pendingDrop.y}
                onSelect={async (type: PageType) => {
                  await handlePendingDropSelect(type);
                }}
                onClose={clearPendingDrop}
              />
            ) : null}

            {nodes.map((node, index) => {
              const nodeBranches = branches.filter(
                (branch) => branch.fromId === node.id,
              );
              const defaultBranch = nodeBranches.find(
                (branch) => !branch.isConditional,
              );
              const conditionalBranches = nodeBranches.filter(
                (branch) => branch.isConditional,
              );

              return (
                <div
                  key={getLogicNodeKey(node.id, index)}
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
                    isFirst={index === 0}
                    isExpanded={
                      conditionalBranches.length > 0
                        ? true
                        : expandedNodeId === node.id
                    }
                    isDropTarget={dropTargetId === node.id}
                    defaultBranch={defaultBranch}
                    outBranches={conditionalBranches}
                    onToggleExpand={() => handleNodeToggle(node.id)}
                    onAddPage={(type) =>
                      void addNodeFrom(
                        node.id,
                        type,
                        undefined,
                        "default",
                        defaultBranch?.id,
                      )
                    }
                    onDeleteBranch={deleteBranch}
                    onOpenBranchCondition={openBranchConditionEditor}
                    onStartConnectDrag={startConnectDrag}
                    onAddConditionalSlot={() => addConditionalSlot(node.id)}
                    onContextMenuOpen={(x, y) =>
                      setNodeMenu({ nodeId: node.id, x, y })
                    }
                    isRenaming={renamingNodeId === node.id}
                    onDoubleClickTitle={() => setRenamingNodeId(node.id)}
                    onRenameCommit={(title) =>
                      handleNodeRenameCommit(node.id, title)
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        {activeConditionBranch ? (
          <BranchConditionPopover
            anchorEl={conditionEditorAnchorEl}
            branchId={activeConditionBranch.id}
            branch={activeConditionBranch}
            availableFields={activeConditionFields}
            onUpdate={(updates) =>
              updateBranchCondition(activeConditionBranch.id, updates)
            }
            onClose={closeBranchConditionEditor}
          />
        ) : null}

        <div
          data-no-drag="true"
          className="absolute bottom-4 left-4 z-10 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <button
            onClick={() => zoomAtCenter(Math.min(2, +(zoom + 0.1).toFixed(1)))}
            className="flex h-9 w-9 items-center justify-center border-b border-gray-100 text-gray-500 transition-colors hover:bg-gray-50"
            title="Zoom in (Ctrl++)"
          >
            <MagnifyingGlassPlusIcon size={16} />
          </button>
          <button
            onClick={() =>
              zoomAtCenter(Math.max(0.3, +(zoom - 0.1).toFixed(1)))
            }
            className="flex h-9 w-9 items-center justify-center border-b border-gray-100 text-gray-500 transition-colors hover:bg-gray-50"
            title="Zoom out (Ctrl+-)"
          >
            <MagnifyingGlassMinusIcon size={16} />
          </button>
          <button
            onClick={resetZoom}
            className="flex h-9 w-9 items-center justify-center border-b border-gray-100 text-gray-500 transition-colors hover:bg-gray-50"
            title="Reset zoom (Ctrl+0)"
          >
            <ArrowsOutIcon size={16} />
          </button>
          <button
            onPointerDown={(event) => event.stopPropagation()}
            className="flex h-9 w-9 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50"
          >
            <span className="text-[10px] font-bold">
              {Math.round(zoom * 100)}%
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {nodeMenu !== null ? (
          (() => {
            const menuIndex = nodes.findIndex((node) => node.id === nodeMenu.nodeId);
            if (menuIndex < 0) return null;

            return (
              <NodeContextMenu
                key="node-ctx"
                x={nodeMenu.x}
                y={nodeMenu.y}
                isFirst={menuIndex === 0}
                pageType={nodes[menuIndex]?.pageType ?? "page"}
                onClose={closeNodeMenu}
                onRename={() => {
                  setRenamingNodeId(nodeMenu.nodeId);
                  closeNodeMenu();
                }}
                onDuplicate={() => {
                  onDuplicatePage?.(nodeMenu.nodeId);
                  closeNodeMenu();
                }}
                onDelete={() => requestDeleteNode(nodeMenu.nodeId)}
                onSetFirstPage={() => {
                  onSetFirstPage?.(nodeMenu.nodeId);
                  closeNodeMenu();
                }}
              />
            );
          })()
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {branchHintToast ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg"
          >
            This page now branches - set a condition for the new path
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        key="logic-modal-confirm-delete"
        isOpen={confirmDeleteNodeId !== null}
        title="Delete Section"
        description="Are you sure? This section and its logic connections will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onClose={closeConfirmDeleteNode}
        onConfirm={handleConfirmDeleteNode}
      />
    </>
  );
}
