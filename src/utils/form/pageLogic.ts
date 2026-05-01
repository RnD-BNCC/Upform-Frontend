import type {
  ConditionGroup,
  FormCalculation,
  FormSection,
  PageLogicBranchConfig,
  PageLogicConfig,
} from "@/types/form";
import { evaluateReferenceConditionTree } from "@/utils/form/referenceTokens";
import { getFormCalculationsFromSections } from "./calculations";

export type RuntimePageLogicBranch = {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  conditionTree?: PageLogicBranchConfig["conditionTree"];
  isConditional?: boolean;
};

const getDefaultBranchId = (sectionId: string, branchId?: string) =>
  branchId?.trim() || `default:${sectionId}`;

const getConditionalBranchId = (
  sectionId: string,
  index: number,
  branchId?: string,
) => branchId?.trim() || `cond:${sectionId}:${index}`;

function getPageLogicConfig(section: FormSection): PageLogicConfig | undefined {
  const config = section.settings?.pageLogic;
  if (!config || typeof config !== "object") return undefined;
  return config;
}

function buildFallbackDefaultBranch(
  sections: FormSection[],
  index: number,
): RuntimePageLogicBranch | null {
  const section = sections[index];
  if (!section || section.pageType === "ending") return null;
  const nextSection = sections[index + 1];
  if (!nextSection) return null;

  return {
    id: getDefaultBranchId(section.id),
    fromId: section.id,
    toId: nextSection.id,
    isConditional: false,
  };
}

export function buildRuntimePageLogicBranches(
  sections: FormSection[],
): RuntimePageLogicBranch[] {
  const validSectionIds = new Set(sections.map((section) => section.id));

  return sections.flatMap((section, index) => {
    if (section.pageType === "ending") return [];

    const config = getPageLogicConfig(section);

    if (!config) {
      const fallbackBranch = buildFallbackDefaultBranch(sections, index);
      return fallbackBranch ? [fallbackBranch] : [];
    }

    const runtimeBranches: RuntimePageLogicBranch[] = [];
    const fallbackBranch = buildFallbackDefaultBranch(sections, index);
    const allowDefaultFallback = config.disableDefaultFallback !== true;

    if (config.defaultTargetId && validSectionIds.has(config.defaultTargetId)) {
      runtimeBranches.push({
        id: getDefaultBranchId(section.id, config.defaultBranchId),
        fromId: section.id,
        toId: config.defaultTargetId,
        isConditional: false,
      });
    } else if (allowDefaultFallback && fallbackBranch) {
      runtimeBranches.push(fallbackBranch);
    }

    for (const [index, branch] of (config.conditionalBranches ?? []).entries()) {
      runtimeBranches.push({
        id: getConditionalBranchId(section.id, index, branch.id),
        fromId: section.id,
        toId:
          branch.toId && validSectionIds.has(branch.toId) ? branch.toId : "",
        label: branch.label,
        conditionTree: branch.conditionTree,
        isConditional: true,
      });
    }

    return runtimeBranches;
  });
}

export function applyRuntimePageLogicToSections(
  sections: FormSection[],
  branches: RuntimePageLogicBranch[],
): FormSection[] {
  const branchesBySource = new Map<string, RuntimePageLogicBranch[]>();

  for (const branch of branches) {
    const current = branchesBySource.get(branch.fromId) ?? [];
    current.push(branch);
    branchesBySource.set(branch.fromId, current);
  }

  return sections.map((section, index) => {
    const nextSettings = { ...(section.settings ?? {}) };

    if (section.pageType === "ending") {
      if ("pageLogic" in nextSettings) {
        delete nextSettings.pageLogic;
      }
      return {
        ...section,
        settings: Object.keys(nextSettings).length > 0 ? nextSettings : undefined,
      };
    }

    const sectionBranches = branchesBySource.get(section.id) ?? [];
    const defaultBranch = sectionBranches.find((branch) => !branch.isConditional);
    const conditionalBranches: PageLogicBranchConfig[] = sectionBranches
      .filter((branch) => branch.isConditional)
      .map((branch) => ({
        id: branch.id,
        toId: branch.toId ?? "",
        ...(branch.label ? { label: branch.label } : {}),
        ...(branch.conditionTree ? { conditionTree: branch.conditionTree } : {}),
      }));
    const hasNextSection = Boolean(sections[index + 1]?.id);
    const defaultTargetId = defaultBranch?.toId ?? "";

    if (!defaultTargetId && conditionalBranches.length === 0 && !hasNextSection) {
      if ("pageLogic" in nextSettings) {
        delete nextSettings.pageLogic;
      }

      return {
        ...section,
        settings: Object.keys(nextSettings).length > 0 ? nextSettings : undefined,
      };
    }

    nextSettings.pageLogic = {
      defaultBranchId: getDefaultBranchId(section.id, defaultBranch?.id),
      defaultTargetId,
      conditionalBranches,
      ...(!defaultBranch ? { disableDefaultFallback: true } : {}),
    };

    return {
      ...section,
      settings: nextSettings,
    };
  });
}

export function buildFlowOrderedSectionIds(
  sections: FormSection[],
  branches: RuntimePageLogicBranch[],
): string[] {
  const sectionIds = sections.map((section) => section.id);
  const validIds = new Set(sectionIds);
  const defaultTargets = new Map<string, string>();
  const conditionalTargets = new Map<string, string[]>();
  const orderedIds: string[] = [];
  const visited = new Set<string>();

  for (const branch of branches) {
    if (!branch.toId || !validIds.has(branch.toId)) continue;

    if (branch.isConditional) {
      const targets = conditionalTargets.get(branch.fromId) ?? [];
      if (!targets.includes(branch.toId)) {
        targets.push(branch.toId);
      }
      conditionalTargets.set(branch.fromId, targets);
      continue;
    }

    defaultTargets.set(branch.fromId, branch.toId);
  }

  const walkChain = (startId?: string) => {
    let currentId = startId;

    while (currentId && validIds.has(currentId) && !visited.has(currentId)) {
      visited.add(currentId);
      orderedIds.push(currentId);

      const nextId = defaultTargets.get(currentId);
      if (!nextId || visited.has(nextId)) break;
      currentId = nextId;
    }
  };

  walkChain(sectionIds[0]);

  for (let index = 0; index < orderedIds.length; index += 1) {
    const currentId = orderedIds[index];
    for (const targetId of conditionalTargets.get(currentId) ?? []) {
      walkChain(targetId);
    }
  }

  for (const sectionId of sectionIds) {
    walkChain(sectionId);
  }

  return orderedIds;
}

export function reorderSectionsByPageLogic(
  sections: FormSection[],
  branches: RuntimePageLogicBranch[],
): FormSection[] {
  const orderedIds = buildFlowOrderedSectionIds(sections, branches);
  const orderMap = new Map(orderedIds.map((sectionId, index) => [sectionId, index]));

  return [...sections].sort((left, right) => {
    const leftOrder = orderMap.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = orderMap.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}

export function evaluatePageLogicCondition(
  tree: ConditionGroup | undefined,
  answers: Record<string, string | string[]>,
  calculations?: FormCalculation[],
): boolean {
  return evaluateReferenceConditionTree(tree, { answers, calculations });
}

export function resolvePageLogicNextSectionId(
  sections: FormSection[],
  currentSectionId: string,
  answers: Record<string, string | string[]>,
): string | null {
  const currentSection = sections.find((section) => section.id === currentSectionId);
  if (!currentSection || currentSection.pageType === "ending") return null;

  const branches = buildRuntimePageLogicBranches(sections).filter(
    (branch) => branch.fromId === currentSectionId,
  );
  const calculations = getFormCalculationsFromSections(sections);

  for (const branch of branches) {
    if (!branch.isConditional || !branch.toId) continue;
    if (!evaluatePageLogicCondition(branch.conditionTree, answers, calculations)) {
      continue;
    }

    return branch.toId;
  }

  const defaultBranch = branches.find((branch) => !branch.isConditional && branch.toId);
  if (!defaultBranch?.toId) return null;

  return defaultBranch.toId;
}
