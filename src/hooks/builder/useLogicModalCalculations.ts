import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAvailableConditionFieldGroupsForForm,
  getAvailableConditionFieldsForForm,
  getFormCalculationsFromSections,
  normalizeGroupedNumberInput,
} from "@/utils/form";
import type {
  CalculationRule,
  CalculationType,
  ConditionGroup,
  ConditionNode,
  FormCalculation,
  FormSection,
} from "@/types/form";
import type { LogicModalRequestedTab } from "@/utils/form/logicModalEvents";

type CalculationView = "empty" | "create" | "list" | "detail";
type SaveToastType = "success" | "error" | "info";

type CalculationContextMenuState = {
  calculation: FormCalculation;
  x: number;
  y: number;
};

type PendingCalculationDeleteState = {
  id: string;
  name: string;
};

type ShowToast = (
  message: string,
  type?: SaveToastType,
  duration?: number,
) => void;

type PersistCalculations = (calculations: FormCalculation[]) => Promise<boolean>;

type PersistModalStateOptions = {
  selectedCalculation?: FormCalculation | null;
  view?: CalculationView;
  successMessage?: string;
};

type StageCalculationDraftOptions = {
  selectedCalculation?: FormCalculation | null;
  view?: CalculationView;
};

function normalizeCalculationInitialValue(calculation: FormCalculation) {
  const trimmedValue = calculation.initialValue?.trim() ?? "";

  if (calculation.type !== "number") {
    return trimmedValue;
  }

  if (!trimmedValue) return "";

  const normalizedValue = normalizeGroupedNumberInput(trimmedValue);
  const parsedValue = Number(normalizedValue);
  return normalizedValue && Number.isFinite(parsedValue) ? normalizedValue : "";
}

function createEmptyConditionTree(): ConditionGroup {
  return {
    type: "group",
    logic: "and",
    items: [],
  };
}

function createCalculationRule(
  operation: CalculationRule["operation"] = "add",
): CalculationRule {
  return {
    id: crypto.randomUUID(),
    operation,
    value: "",
  };
}

function cloneConditionNode(node: ConditionNode): ConditionNode {
  return node.type === "group" ? cloneConditionGroup(node) : { ...node };
}

function cloneConditionGroup(group: ConditionGroup): ConditionGroup {
  return {
    ...group,
    items: group.items.map(cloneConditionNode),
  };
}

function cloneCalculationRules(rules?: CalculationRule[]): CalculationRule[] {
  return (
    rules?.map((rule) => ({
      ...rule,
      id: crypto.randomUUID(),
      conditionTree: rule.conditionTree
        ? cloneConditionGroup(rule.conditionTree)
        : undefined,
    })) ?? []
  );
}

function getDuplicateCalculationName(
  sourceName: string,
  calculations: FormCalculation[],
) {
  const normalizedName = sourceName.trim();
  const baseName = normalizedName.replace(/ Copy(?: \d+)?$/, "") || "Calculation";
  const existingNames = new Set(
    calculations.map((calculation) => calculation.name.trim().toLowerCase()),
  );

  let candidate = `${baseName} Copy`;
  let index = 2;
  while (existingNames.has(candidate.trim().toLowerCase())) {
    candidate = `${baseName} Copy ${index}`;
    index += 1;
  }

  return candidate;
}

function mergeSelectedCalculationDraft(
  calculations: FormCalculation[],
  selectedCalculationId: string | null,
  calculationInitialValue: string,
): FormCalculation[] {
  if (!selectedCalculationId) {
    return calculations;
  }

  let changed = false;
  const nextCalculations = calculations.map((calculation) => {
    if (calculation.id !== selectedCalculationId) {
      return calculation;
    }

    const nextInitialValue = calculationInitialValue;
    if ((calculation.initialValue ?? "") === nextInitialValue) {
      return calculation;
    }

    changed = true;
    return {
      ...calculation,
      initialValue: nextInitialValue,
    };
  });

  return changed ? nextCalculations : calculations;
}

type UseLogicModalCalculationsArgs = {
  activeTab: LogicModalRequestedTab;
  isOpen: boolean;
  pages: FormSection[];
  persistCalculations?: PersistCalculations;
  setIsSavingFlow: (value: boolean) => void;
  showPersistToast: ShowToast;
  showSaveToast: ShowToast;
};

export type LogicModalCalculationsController = {
  calculationContextMenu: CalculationContextMenuState | null;
  calculationDetail: FormCalculation | null;
  calculationInitialValue: string;
  calculationItems: FormCalculation[];
  calculationRuleAvailableFieldGroups: ReturnType<
    typeof getAvailableConditionFieldGroupsForForm
  >;
  calculationRuleAvailableFields: ReturnType<
    typeof getAvailableConditionFieldsForForm
  >;
  calculationRuleConditionEditorAnchorEl: HTMLElement | null;
  calculationRuleConditionEditorRuleId: string | null;
  calculationView: CalculationView;
  newCalculationName: string;
  newCalculationType: CalculationType;
  pendingCalculationDelete: PendingCalculationDeleteState | null;
  activeCalculationRuleCondition: CalculationRule | null;
  clearPendingCalculationDelete: () => void;
  closeCalculationContextMenu: () => void;
  closeCalculationRuleConditionEditor: () => void;
  handleAddCalculationRule: () => void;
  handleCreateCalculation: () => void;
  handleDeleteCalculation: (calculationId: string) => void;
  handleDeleteCalculationRule: (ruleId: string) => void;
  handleDuplicateCalculation: (calculation: FormCalculation) => void;
  handleSaveCalculationDetail: () => Promise<void>;
  handleToggleCalculationRuleAlways: (
    rule: CalculationRule,
    always: boolean,
  ) => void;
  openCreateCalculation: () => void;
  openCalculationContextMenu: (
    calculation: FormCalculation,
    x: number,
    y: number,
  ) => void;
  openCalculationDetail: (calculation: FormCalculation) => void;
  openCalculationList: () => void;
  openCalculationRuleConditionEditor: (
    rule: CalculationRule,
    anchorEl: HTMLElement,
  ) => void;
  persistModalState: (options?: PersistModalStateOptions) => Promise<boolean>;
  requestDeleteCalculation: (calculation: FormCalculation) => void;
  setCalculationInitialValue: (value: string) => void;
  setNewCalculationName: (value: string) => void;
  setNewCalculationType: (value: CalculationType) => void;
  toggleCalculationContextMenu: (
    calculation: FormCalculation,
    x: number,
    y: number,
  ) => void;
  updateCalculationRule: (
    ruleId: string,
    updater: (rule: CalculationRule) => CalculationRule,
  ) => void;
  updateCalculationDetail: (
    updater: (calculation: FormCalculation) => FormCalculation,
  ) => void;
};

export function useLogicModalCalculations({
  activeTab,
  isOpen,
  pages,
  persistCalculations,
  setIsSavingFlow,
  showPersistToast,
  showSaveToast,
}: UseLogicModalCalculationsArgs): LogicModalCalculationsController {
  const [calculationView, setCalculationView] =
    useState<CalculationView>("empty");
  const [newCalculationName, setNewCalculationNameState] = useState("");
  const [newCalculationType, setNewCalculationTypeState] =
    useState<CalculationType>("number");
  const [selectedCalculationId, setSelectedCalculationId] = useState<
    string | null
  >(null);
  const [calculationInitialValue, setCalculationInitialValueState] = useState("");
  const [optimisticCalculations, setOptimisticCalculations] = useState<
    FormCalculation[] | null
  >(null);
  const [calculationContextMenu, setCalculationContextMenu] =
    useState<CalculationContextMenuState | null>(null);
  const [pendingCalculationDelete, setPendingCalculationDelete] =
    useState<PendingCalculationDeleteState | null>(null);
  const [calculationRuleConditionEditorRuleId, setCalculationRuleConditionEditorRuleId] =
    useState<string | null>(null);
  const [calculationRuleConditionEditorAnchorEl, setCalculationRuleConditionEditorAnchorEl] =
    useState<HTMLElement | null>(null);

  const previousActiveTabRef = useRef<LogicModalRequestedTab | null>(null);

  const calculations = useMemo(
    () => getFormCalculationsFromSections(pages),
    [pages],
  );
  const calculationItems = optimisticCalculations ?? calculations;
  const selectedCalculation = useMemo(
    () =>
      calculationItems.find(
        (calculation) => calculation.id === selectedCalculationId,
      ) ?? null,
    [calculationItems, selectedCalculationId],
  );
  const calculationDraft = useMemo(
    () =>
      mergeSelectedCalculationDraft(
        calculationItems,
        selectedCalculationId,
        calculationInitialValue,
      ),
    [calculationInitialValue, calculationItems, selectedCalculationId],
  );
  const selectedCalculationDraft = useMemo(
    () =>
      calculationDraft.find(
        (calculation) => calculation.id === selectedCalculationId,
      ) ?? null,
    [calculationDraft, selectedCalculationId],
  );
  const calculationDetail = selectedCalculationDraft ?? selectedCalculation;
  const calculationsSignature = useMemo(
    () => JSON.stringify(calculations),
    [calculations],
  );
  const calculationDraftSignature = useMemo(
    () => JSON.stringify(calculationDraft),
    [calculationDraft],
  );
  const hasUnsavedCalculationChanges =
    calculationDraftSignature !== calculationsSignature ||
    (calculationView === "create" &&
      (newCalculationName.trim().length > 0 ||
        newCalculationType !== "number"));
  const calculationRuleAvailableFields = useMemo(
    () => getAvailableConditionFieldsForForm(pages),
    [pages],
  );
  const calculationRuleAvailableFieldGroups = useMemo(
    () => getAvailableConditionFieldGroupsForForm(pages),
    [pages],
  );
  const activeCalculationRuleCondition = useMemo(
    () =>
      calculationRuleConditionEditorRuleId
        ? (selectedCalculationDraft?.rules?.find(
            (rule) => rule.id === calculationRuleConditionEditorRuleId,
          ) ?? null)
        : null,
    [calculationRuleConditionEditorRuleId, selectedCalculationDraft],
  );

  const setNewCalculationName = useCallback((value: string) => {
    setNewCalculationNameState(value);
  }, []);

  const setNewCalculationType = useCallback((value: CalculationType) => {
    setNewCalculationTypeState(value);
  }, []);

  const setCalculationInitialValue = useCallback((value: string) => {
    setCalculationInitialValueState(value);
  }, []);

  const closeCalculationContextMenu = useCallback(() => {
    setCalculationContextMenu(null);
  }, []);

  const clearPendingCalculationDelete = useCallback(() => {
    setPendingCalculationDelete(null);
  }, []);

  const closeCalculationRuleConditionEditor = useCallback(() => {
    setCalculationRuleConditionEditorRuleId(null);
    setCalculationRuleConditionEditorAnchorEl(null);
  }, []);

  const stageCalculationDraft = useCallback(
    (
      nextCalculations: FormCalculation[],
      options?: StageCalculationDraftOptions,
    ) => {
      setCalculationContextMenu(null);
      setPendingCalculationDelete(null);
      setOptimisticCalculations(
        JSON.stringify(nextCalculations) === calculationsSignature
          ? null
          : nextCalculations,
      );

      if (options?.selectedCalculation !== undefined) {
        setSelectedCalculationId(options.selectedCalculation?.id ?? null);
        setCalculationInitialValueState(
          options.selectedCalculation?.initialValue ?? "",
        );
      }

      if (options?.view) {
        setCalculationView(options.view);
      }
    },
    [calculationsSignature],
  );

  const persistModalState = useCallback(
    async (options?: PersistModalStateOptions) => {
      if (!persistCalculations) {
        showPersistToast("Unable to save changes", "error");
        return false;
      }

      const nextCalculations = calculationDraft.map((calculation) => ({
        ...calculation,
        initialValue: normalizeCalculationInitialValue(calculation),
        durationStartValue:
          calculation.type === "duration"
            ? calculation.durationStartValue?.trim() ?? ""
            : calculation.durationStartValue,
        durationEndValue:
          calculation.type === "duration"
            ? calculation.durationEndValue?.trim() ?? ""
            : calculation.durationEndValue,
        durationUnit:
          calculation.type === "duration"
            ? calculation.durationUnit ?? "days"
            : calculation.durationUnit,
      }));
      const nextSelectedCalculation =
        options?.selectedCalculation === undefined
          ? undefined
          : options.selectedCalculation
            ? (nextCalculations.find(
                (calculation) =>
                  calculation.id === options.selectedCalculation?.id,
              ) ?? null)
            : null;

      setIsSavingFlow(true);
      setCalculationContextMenu(null);
      setPendingCalculationDelete(null);
      showPersistToast("Saving...", "info", 0);

      try {
        const result = await persistCalculations(nextCalculations);

        if (!result) {
          showPersistToast("Save failed", "error");
          return false;
        }

        setOptimisticCalculations(nextCalculations);

        if (nextSelectedCalculation !== undefined) {
          setSelectedCalculationId(nextSelectedCalculation?.id ?? null);
          setCalculationInitialValueState(
            nextSelectedCalculation?.initialValue ?? "",
          );
        } else if (selectedCalculationId) {
          const activeCalculation =
            nextCalculations.find(
              (calculation) => calculation.id === selectedCalculationId,
            ) ?? null;
          setCalculationInitialValueState(activeCalculation?.initialValue ?? "");
        }

        if (options?.view) {
          setCalculationView(options.view);
        }

        showPersistToast(options?.successMessage ?? "Saved successfully");
        return true;
      } catch (error) {
        console.error("[useLogicModalCalculations.persistModalState]:", error);
        showPersistToast("Save failed", "error");
        return false;
      } finally {
        setIsSavingFlow(false);
      }
    },
    [
      calculationDraft,
      persistCalculations,
      selectedCalculationId,
      setIsSavingFlow,
      showPersistToast,
    ],
  );

  const openCalculationList = useCallback(() => {
    if (calculationDraft.length === 0) {
      setSelectedCalculationId(null);
      setCalculationInitialValueState("");
      setPendingCalculationDelete(null);
      closeCalculationRuleConditionEditor();
      setCalculationView("empty");
      return;
    }

    const nextSelectedCalculation =
      calculationDraft.find(
        (calculation) => calculation.id === selectedCalculationId,
      ) ??
      calculationDraft[0] ??
      null;

    closeCalculationRuleConditionEditor();
    stageCalculationDraft(calculationDraft, {
      selectedCalculation: nextSelectedCalculation,
      view: "list",
    });
  }, [
    calculationDraft,
    closeCalculationRuleConditionEditor,
    selectedCalculationId,
    stageCalculationDraft,
  ]);

  const openCalculationDetail = useCallback(
    (calculation: FormCalculation) => {
      const nextSelectedCalculation =
        calculationDraft.find((item) => item.id === calculation.id) ??
        calculation;

      closeCalculationRuleConditionEditor();
      stageCalculationDraft(calculationDraft, {
        selectedCalculation: nextSelectedCalculation,
        view: "detail",
      });
    },
    [calculationDraft, closeCalculationRuleConditionEditor, stageCalculationDraft],
  );

  const openCreateCalculation = useCallback(() => {
    closeCalculationContextMenu();
    clearPendingCalculationDelete();
    closeCalculationRuleConditionEditor();
    setNewCalculationNameState("");
    setNewCalculationTypeState("number");
    setCalculationView("create");
  }, [
    clearPendingCalculationDelete,
    closeCalculationContextMenu,
    closeCalculationRuleConditionEditor,
  ]);

  const handleCreateCalculation = useCallback(() => {
    const name = newCalculationName.trim();

    if (!name) {
      showSaveToast("Calculation name is required", "error");
      return;
    }

    const nextCalculation: FormCalculation = {
      id: crypto.randomUUID(),
      name,
      type: newCalculationType,
      initialValue: "",
      durationUnit: newCalculationType === "duration" ? "days" : undefined,
      rules: [],
    };

    const nextCalculations = [...calculationDraft, nextCalculation];
    stageCalculationDraft(nextCalculations, {
      selectedCalculation: nextCalculation,
      view: "detail",
    });

    setNewCalculationNameState("");
    setNewCalculationTypeState("number");
  }, [
    calculationDraft,
    newCalculationName,
    newCalculationType,
    showSaveToast,
    stageCalculationDraft,
  ]);

  const stageSelectedCalculationDetail = useCallback(
    (updater: (calculation: FormCalculation) => FormCalculation) => {
      if (!selectedCalculationDraft) return;

      const nextCalculations = calculationDraft.map((calculation) =>
        calculation.id === selectedCalculationDraft.id
          ? updater(calculation)
          : calculation,
      );
      const nextSelectedCalculation =
        nextCalculations.find(
          (calculation) => calculation.id === selectedCalculationDraft.id,
        ) ?? null;

      stageCalculationDraft(nextCalculations, {
        selectedCalculation: nextSelectedCalculation,
        view: "detail",
      });
    },
    [calculationDraft, selectedCalculationDraft, stageCalculationDraft],
  );

  const handleAddCalculationRule = useCallback(() => {
    if (!selectedCalculationDraft) return;

    if (selectedCalculationDraft.type === "duration") {
      showSaveToast(
        "Duration calculations use start and end values instead of rules",
        "info",
        2200,
      );
      return;
    }

    stageSelectedCalculationDetail((calculation) => ({
      ...calculation,
      rules: [
        ...(calculation.rules ?? []),
        createCalculationRule(calculation.type === "text" ? "set" : "add"),
      ],
    }));
  }, [
    selectedCalculationDraft,
    showSaveToast,
    stageSelectedCalculationDetail,
  ]);

  const updateCalculationRule = useCallback(
    (
      ruleId: string,
      updater: (rule: CalculationRule) => CalculationRule,
    ) => {
      stageSelectedCalculationDetail((calculation) => ({
        ...calculation,
        rules: (calculation.rules ?? []).map((rule) =>
          rule.id === ruleId ? updater(rule) : rule,
        ),
      }));
    },
    [stageSelectedCalculationDetail],
  );

  const openCalculationRuleConditionEditor = useCallback(
    (rule: CalculationRule, anchorEl: HTMLElement) => {
      if (!rule.conditionTree) {
        updateCalculationRule(rule.id, (currentRule) => ({
          ...currentRule,
          conditionTree: createEmptyConditionTree(),
        }));
      }

      setCalculationRuleConditionEditorRuleId(rule.id);
      setCalculationRuleConditionEditorAnchorEl(anchorEl);
    },
    [updateCalculationRule],
  );

  const handleToggleCalculationRuleAlways = useCallback(
    (rule: CalculationRule, always: boolean) => {
      updateCalculationRule(rule.id, (currentRule) => ({
        ...currentRule,
        conditionTree: always
          ? undefined
          : currentRule.conditionTree ?? createEmptyConditionTree(),
      }));

      if (always && calculationRuleConditionEditorRuleId === rule.id) {
        closeCalculationRuleConditionEditor();
      }
    },
    [
      calculationRuleConditionEditorRuleId,
      closeCalculationRuleConditionEditor,
      updateCalculationRule,
    ],
  );

  const handleDeleteCalculationRule = useCallback(
    (ruleId: string) => {
      stageSelectedCalculationDetail((calculation) => ({
        ...calculation,
        rules: (calculation.rules ?? []).filter((rule) => rule.id !== ruleId),
      }));

      if (calculationRuleConditionEditorRuleId === ruleId) {
        closeCalculationRuleConditionEditor();
      }
    },
    [
      calculationRuleConditionEditorRuleId,
      closeCalculationRuleConditionEditor,
      stageSelectedCalculationDetail,
    ],
  );

  const handleSaveCalculationDetail = useCallback(async () => {
    if (!selectedCalculationDraft) return;

    const updatedCalculation =
      calculationDraft.find(
        (calculation) => calculation.id === selectedCalculationDraft.id,
      ) ?? null;

    await persistModalState({
      selectedCalculation: updatedCalculation,
      view: "list",
    });
  }, [calculationDraft, persistModalState, selectedCalculationDraft]);

  const handleDuplicateCalculation = useCallback(
    (calculation: FormCalculation) => {
      const sourceCalculation =
        calculationDraft.find((item) => item.id === calculation.id) ??
        calculation;
      const duplicatedCalculation: FormCalculation = {
        ...sourceCalculation,
        id: crypto.randomUUID(),
        name: getDuplicateCalculationName(
          sourceCalculation.name,
          calculationDraft,
        ),
        rules: cloneCalculationRules(sourceCalculation.rules),
      };

      const shouldOpenDuplicatedDetail =
        calculationView === "detail" && selectedCalculationId === calculation.id;

      stageCalculationDraft([...calculationDraft, duplicatedCalculation], {
        selectedCalculation: shouldOpenDuplicatedDetail
          ? duplicatedCalculation
          : undefined,
        view: shouldOpenDuplicatedDetail ? "detail" : "list",
      });
    },
    [
      calculationDraft,
      calculationView,
      selectedCalculationId,
      stageCalculationDraft,
    ],
  );

  const handleDeleteCalculation = useCallback(
    (calculationId: string) => {
      const nextCalculations = calculationDraft.filter(
        (calculation) => calculation.id !== calculationId,
      );

      stageCalculationDraft(nextCalculations, {
        view: nextCalculations.length > 0 ? "list" : "empty",
        selectedCalculation:
          nextCalculations.length > 0 ? nextCalculations[0] : null,
      });
    },
    [calculationDraft, stageCalculationDraft],
  );

  const requestDeleteCalculation = useCallback((calculation: FormCalculation) => {
    setCalculationContextMenu(null);
    setPendingCalculationDelete({
      id: calculation.id,
      name: calculation.name,
    });
  }, []);

  const openCalculationContextMenu = useCallback(
    (calculation: FormCalculation, x: number, y: number) => {
      setCalculationContextMenu({
        calculation,
        x,
        y,
      });
    },
    [],
  );

  const toggleCalculationContextMenu = useCallback(
    (calculation: FormCalculation, x: number, y: number) => {
      setCalculationContextMenu((current) =>
        current?.calculation.id === calculation.id
          ? null
          : {
              calculation,
              x,
              y,
            },
      );
    },
    [],
  );

  useEffect(() => {
    if (optimisticCalculations === null) return;
    if (calculationDraftSignature === calculationsSignature) {
      setOptimisticCalculations(null);
    }
  }, [calculationDraftSignature, calculationsSignature, optimisticCalculations]);

  useEffect(() => {
    if (!isOpen || !hasUnsavedCalculationChanges) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedCalculationChanges, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      previousActiveTabRef.current = null;
      setCalculationView("empty");
      setNewCalculationNameState("");
      setNewCalculationTypeState("number");
      setSelectedCalculationId(null);
      setCalculationInitialValueState("");
      setOptimisticCalculations(null);
      setCalculationContextMenu(null);
      setPendingCalculationDelete(null);
      closeCalculationRuleConditionEditor();
      return;
    }

    const previousActiveTab = previousActiveTabRef.current;
    previousActiveTabRef.current = activeTab;

    if (previousActiveTab === "calculations" && activeTab !== "calculations") {
      closeCalculationContextMenu();
      clearPendingCalculationDelete();
      closeCalculationRuleConditionEditor();
      stageCalculationDraft(calculationDraft);
      return;
    }

    if (activeTab !== "calculations") return;

    if (calculationItems.length === 0) {
      if (calculationView !== "create") {
        setSelectedCalculationId(null);
        setCalculationInitialValueState("");
        setCalculationView("empty");
      }
      return;
    }

    if (!selectedCalculationId) {
      setSelectedCalculationId(calculationItems[0]?.id ?? null);
      setCalculationInitialValueState(calculationItems[0]?.initialValue ?? "");
      if (calculationView === "empty") {
        setCalculationView("list");
      }
    } else if (!selectedCalculation) {
      setSelectedCalculationId(calculationItems[0]?.id ?? null);
      setCalculationInitialValueState(calculationItems[0]?.initialValue ?? "");
      if (calculationView === "detail" || calculationView === "empty") {
        setCalculationView("list");
      }
    } else if (calculationView === "empty") {
      setCalculationView("list");
    } else if (calculationView === "list") {
      setCalculationInitialValueState(selectedCalculation.initialValue ?? "");
    }
  }, [
    activeTab,
    calculationDraft,
    calculationItems,
    calculationView,
    clearPendingCalculationDelete,
    closeCalculationContextMenu,
    closeCalculationRuleConditionEditor,
    isOpen,
    selectedCalculation,
    selectedCalculationId,
    stageCalculationDraft,
  ]);

  useEffect(() => {
    if (!calculationRuleConditionEditorRuleId) return;
    if (activeTab !== "calculations" || !activeCalculationRuleCondition) {
      closeCalculationRuleConditionEditor();
    }
  }, [
    activeCalculationRuleCondition,
    activeTab,
    calculationRuleConditionEditorRuleId,
    closeCalculationRuleConditionEditor,
  ]);

  return {
    activeCalculationRuleCondition,
    calculationContextMenu,
    calculationDetail,
    calculationInitialValue,
    calculationItems,
    calculationRuleAvailableFieldGroups,
    calculationRuleAvailableFields,
    calculationRuleConditionEditorAnchorEl,
    calculationRuleConditionEditorRuleId,
    calculationView,
    clearPendingCalculationDelete,
    closeCalculationContextMenu,
    closeCalculationRuleConditionEditor,
    handleAddCalculationRule,
    handleCreateCalculation,
    handleDeleteCalculation,
    handleDeleteCalculationRule,
    handleDuplicateCalculation,
    handleSaveCalculationDetail,
    handleToggleCalculationRuleAlways,
    newCalculationName,
    newCalculationType,
    openCreateCalculation,
    openCalculationContextMenu,
    openCalculationDetail,
    openCalculationList,
    openCalculationRuleConditionEditor,
    pendingCalculationDelete,
    persistModalState,
    requestDeleteCalculation,
    setCalculationInitialValue,
    setNewCalculationName,
    setNewCalculationType,
    toggleCalculationContextMenu,
    updateCalculationRule,
    updateCalculationDetail: stageSelectedCalculationDetail,
  };
}
