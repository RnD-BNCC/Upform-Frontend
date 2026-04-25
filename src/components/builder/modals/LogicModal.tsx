import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FloppyDiskIcon,
  SpinnerGapIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { FormCalculation, FormSection } from "@/types/form";
import type { LogicModalRequestedTab } from "@/utils/form/logicModalEvents";
import LogicModalCalculationsView from "./LogicModalCalculationsView";
import LogicModalPageLogicView from "./LogicModalPageLogicView";
import type { LogicBranch, PageType } from "./logicModalPageLogic.shared";
import { useLogicModalCalculations } from "@/hooks/builder/useLogicModalCalculations";
import { useLogicModalPageLogic } from "@/hooks/builder/useLogicModalPageLogic";

type SaveToastType = "success" | "error" | "info";

type SaveToastState = {
  message: string;
  type: SaveToastType;
};

type LogicModalTab = LogicModalRequestedTab;
type LogicModalSavePayload = {
  branches: LogicBranch[];
  calculations: FormCalculation[];
};

type Props = {
  id?: string;
  initialTab?: LogicModalTab;
  isOpen: boolean;
  onAddPage?: (
    type: PageType,
  ) => string | Promise<string | undefined> | undefined;
  onClose: () => void;
  onDeletePage?: (id: string) => void;
  onDuplicatePage?: (id: string) => void;
  onFlowChange?: (branches: LogicBranch[]) => void;
  onNodeMove?: (nodeId: string, x: number, y: number) => void;
  onRenamePage?: (id: string, title: string) => void;
  onSave?: (
    payload: LogicModalSavePayload,
  ) => void | boolean | Promise<void | boolean>;
  onSetFirstPage?: (id: string) => void;
  onToast?: (
    message: string,
    type?: SaveToastState["type"],
    duration?: number,
  ) => void;
  pages: FormSection[];
};

export default function LogicModal({
  isOpen,
  initialTab = "pageLogic",
  onClose,
  pages,
  onSave,
  onToast,
  onNodeMove,
  onRenamePage,
  onDeletePage,
  onDuplicatePage,
  onSetFirstPage,
  onAddPage,
  onFlowChange,
}: Props) {
  const [saveToast, setSaveToast] = useState<SaveToastState | null>(null);
  const [isSavingFlow, setIsSavingFlow] = useState(false);
  const [activeTab, setActiveTab] = useState<LogicModalTab>(initialTab);
  const saveToastTimeoutRef = useRef<number | null>(null);

  const showSaveToast = useCallback(
    (
      message: string,
      type: SaveToastState["type"] = "success",
      duration = 2500,
    ) => {
      if (saveToastTimeoutRef.current) {
        window.clearTimeout(saveToastTimeoutRef.current);
        saveToastTimeoutRef.current = null;
      }

      setSaveToast({ message, type });

      if (duration > 0) {
        saveToastTimeoutRef.current = window.setTimeout(() => {
          setSaveToast(null);
          saveToastTimeoutRef.current = null;
        }, duration);
      }
    },
    [],
  );

  const showPersistToast = useCallback(
    (
      message: string,
      type: SaveToastState["type"] = "success",
      duration = 2500,
    ) => {
      showSaveToast(message, type, duration);
      onToast?.(message, type, duration);
    },
    [onToast, showSaveToast],
  );

  const pageLogicController = useLogicModalPageLogic({
    activeTab,
    isOpen,
    onAddPage,
    onDeletePage,
    onFlowChange,
    onNodeMove,
    onRenamePage,
    pages,
  });

  const { branches: pageLogicBranches, prepareForTabChange, resetZoom, zoomAtCenter } =
    pageLogicController;

  const persistCalculations = useCallback(
    async (calculations: FormCalculation[]) => {
      if (!onSave) return false;

      const result = await onSave({
        branches: pageLogicBranches,
        calculations,
      });

      return result !== false;
    },
    [onSave, pageLogicBranches],
  );

  const calculationsController = useLogicModalCalculations({
    activeTab,
    isOpen,
    pages,
    persistCalculations: onSave ? persistCalculations : undefined,
    setIsSavingFlow,
    showPersistToast,
    showSaveToast,
  });

  useEffect(() => {
    return () => {
      if (saveToastTimeoutRef.current) {
        window.clearTimeout(saveToastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;

      const key = event.key.toLowerCase();

      if (key === "s") {
        event.preventDefault();
        event.stopPropagation();
        if (isSavingFlow) return;
        void calculationsController.persistModalState();
        return;
      }

      if (activeTab !== "pageLogic") return;

      if (key === "=" || key === "+") {
        event.preventDefault();
        zoomAtCenter(
          Math.min(2, +(pageLogicController.zoom + 0.1).toFixed(1)),
        );
        return;
      }

      if (key === "-") {
        event.preventDefault();
        zoomAtCenter(
          Math.max(0.3, +(pageLogicController.zoom - 0.1).toFixed(1)),
        );
        return;
      }

      if (key === "0") {
        event.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener("keydown", handler, { capture: true });
    return () =>
      window.removeEventListener("keydown", handler, {
        capture: true,
      });
  }, [
    activeTab,
    calculationsController,
    isOpen,
    isSavingFlow,
    pageLogicController.zoom,
    resetZoom,
    zoomAtCenter,
  ]);

  const handleClose = useCallback(() => {
    prepareForTabChange();
    onClose();
  }, [onClose, prepareForTabChange]);

  const handleTabChange = useCallback(
    (nextTab: LogicModalTab) => {
      if (nextTab === activeTab) return;
      prepareForTabChange();
      setActiveTab(nextTab);
    },
    [activeTab, prepareForTabChange],
  );

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="logic-modal-shell"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className="flex h-[90vh] w-[90vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="z-10 flex h-12 shrink-0 items-center justify-between bg-white px-4">
              <div className="flex-1" />
              <div className="flex items-center gap-1 rounded-xl bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => handleTabChange("pageLogic")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    activeTab === "pageLogic"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Page logic
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("calculations")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    activeTab === "calculations"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {`Calculations${calculationsController.calculationItems.length > 0 ? ` (${calculationsController.calculationItems.length})` : ""}`}
                </button>
              </div>
              <div className="flex flex-1 justify-end">
                <button
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <XIcon size={16} weight="bold" />
                </button>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col">
              {activeTab === "pageLogic" ? (
                <LogicModalPageLogicView
                  controller={pageLogicController}
                  onDuplicatePage={onDuplicatePage}
                  onSetFirstPage={onSetFirstPage}
                  pages={pages}
                />
              ) : (
                <LogicModalCalculationsView
                  controller={calculationsController}
                  isSavingFlow={isSavingFlow}
                />
              )}

              <AnimatePresence>
                {saveToast ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className={`pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-white shadow-lg ${
                      saveToast.type === "error"
                        ? "bg-red-600"
                        : saveToast.type === "info"
                          ? "bg-slate-900"
                          : "bg-gray-900"
                    }`}
                  >
                    {saveToast.type === "info" ? (
                      <SpinnerGapIcon
                        size={12}
                        className="animate-spin text-sky-300"
                      />
                    ) : (
                      <FloppyDiskIcon
                        size={12}
                        weight="bold"
                        className={
                          saveToast.type === "error"
                            ? "text-red-200"
                            : "text-emerald-400"
                        }
                      />
                    )}
                    {saveToast.message}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
