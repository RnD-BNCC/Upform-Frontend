import type { FormSection } from "@/types/form";
import type { BuilderPageType } from "@/types/builder";
import type { RuntimePageLogicBranch } from "@/utils/form/pageLogic";

export type PageType = BuilderPageType;

export type LogicNode = {
  id: string;
  pageType: PageType;
  title: string;
  x: number;
  y: number;
};

export type LogicBranch = RuntimePageLogicBranch;
export type ConnectionMode = "default" | "conditional";

export type ConnectDrag = {
  fromId: string;
  mode: ConnectionMode;
  branchId?: string;
  startY?: number;
  startCX: number;
  startCY: number;
  curX: number;
  curY: number;
};

export type PendingDrop = {
  fromId: string;
  mode: ConnectionMode;
  branchId?: string;
  x: number;
  y: number;
};

export const NODE_W = 220;
export const NODE_H = 56;
export const H_GAP = 270;
export const COND_ROW_H = 30;
export const COND_PANEL_TOP = NODE_H + 9;

export const PAGE_TYPE_LABEL: Record<PageType, string> = {
  cover: "Cover",
  page: "Form page",
  ending: "Ending",
};

export const ADD_PAGE_OPTIONS: { type: PageType; label: string }[] = [
  { type: "page", label: "Form page" },
  { type: "cover", label: "Cover" },
  { type: "ending", label: "Ending" },
];

export function getLogicNodeKey(nodeId: string, index: number) {
  const trimmed = nodeId.trim();
  return trimmed.length > 0 ? `${trimmed}:${index}` : `logic-node-${index}`;
}

export function getLogicBranchId(
  branch: Pick<LogicBranch, "id" | "fromId" | "isConditional">,
  index: number,
) {
  return (
    branch.id?.trim() ||
    `${branch.isConditional ? "cond" : "default"}:${branch.fromId}:${index}`
  );
}

export function hasBranchCondition(branch: Pick<LogicBranch, "conditionTree">) {
  return !!branch.conditionTree?.items.length;
}

export function makeBranch(fromId: string, toId: string): LogicBranch {
  return { id: `default:${fromId}`, fromId, toId, isConditional: false };
}

export function makeConditionalBranchId(fromId: string): string {
  return `cond-${fromId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeConditionalBranch(fromId: string, toId: string): LogicBranch {
  return {
    id: makeConditionalBranchId(fromId),
    fromId,
    toId,
    isConditional: true,
  };
}

export function matchesBranchIdentity(
  branch: LogicBranch,
  branchIndex: number,
  target:
    | string
    | {
        id?: string;
        fromId: string;
        toId: string;
        isConditional?: boolean;
      },
) {
  if (typeof target === "string") {
    return getLogicBranchId(branch, branchIndex) === target;
  }

  const normalizedTargetId = target.id?.trim();
  if (normalizedTargetId) {
    return getLogicBranchId(branch, branchIndex) === normalizedTargetId;
  }

  return (
    branch.fromId === target.fromId &&
    branch.toId === target.toId &&
    !!branch.isConditional === !!target.isConditional
  );
}

export function normalizeLogicBranches(branches: LogicBranch[]): LogicBranch[] {
  const seen = new Set<string>();
  let changed = false;

  const normalized = branches.map((branch, index) => {
    const rawId = getLogicBranchId(branch, index);

    let nextId = rawId;
    let suffix = 1;
    while (seen.has(nextId)) {
      nextId = `${rawId}:${suffix}`;
      suffix += 1;
    }
    seen.add(nextId);

    if (nextId === branch.id) {
      return branch;
    }

    changed = true;
    return {
      ...branch,
      id: nextId,
    };
  });

  return changed ? normalized : branches;
}

export function mergeMissingConditionalBranches(
  nextBranches: LogicBranch[],
  previousBranches: LogicBranch[],
  pages: FormSection[],
) {
  const validPageIds = new Set(pages.map((page) => page.id));
  const nextIds = new Set(
    nextBranches.map((branch, index) => getLogicBranchId(branch, index)),
  );

  const preservedBranches = previousBranches
    .filter((branch, index) => {
      if (!branch.isConditional) return false;
      if (!validPageIds.has(branch.fromId)) return false;

      const branchId = getLogicBranchId(branch, index);
      return !nextIds.has(branchId);
    })
    .map((branch) => ({
      ...branch,
      toId: branch.toId && validPageIds.has(branch.toId) ? branch.toId : "",
    }));

  if (preservedBranches.length === 0) {
    return nextBranches;
  }

  return normalizeLogicBranches([...nextBranches, ...preservedBranches]);
}

export function connectBranchTarget(
  branches: LogicBranch[],
  fromId: string,
  targetId: string,
  mode: ConnectionMode,
  branchId?: string,
) {
  if (mode === "default") {
    const existingDefault = branches.find(
      (branch) => branch.fromId === fromId && !branch.isConditional,
    );

    if (!existingDefault) {
      return [...branches, makeBranch(fromId, targetId)];
    }

    if (existingDefault.toId === targetId) {
      return branches;
    }

    const alreadyConditional = branches.some(
      (branch) =>
        branch.fromId === fromId &&
        branch.toId === targetId &&
        !!branch.isConditional,
    );

    if (alreadyConditional) {
      return branches;
    }

    return [...branches, makeConditionalBranch(fromId, targetId)];
  }

  const existingBranch = branchId
    ? branches.find((branch) => branch.id === branchId)
    : undefined;
  const isConditional = existingBranch?.isConditional ?? true;
  const alreadySame = branches.some(
    (branch) =>
      branch.id !== branchId &&
      branch.fromId === fromId &&
      branch.toId === targetId &&
      !!branch.isConditional === isConditional,
  );

  if (alreadySame) return branches;

  if (existingBranch) {
    return branches.map((branch) =>
      branch.id === existingBranch.id ? { ...branch, toId: targetId } : branch,
    );
  }

  if (branchId) {
    return [
      ...branches,
      { id: branchId, fromId, toId: targetId, isConditional: true },
    ];
  }

  return [...branches, makeConditionalBranch(fromId, targetId)];
}

export function buildNodes(pages: FormSection[]): LogicNode[] {
  const source =
    pages.length > 0
      ? pages
      : [
          {
            id: "default-cover",
            title: "Cover",
            pageType: "cover" as const,
            fields: [],
          },
          {
            id: "default-page",
            title: "Page",
            pageType: "page" as const,
            fields: [],
          },
          {
            id: "default-ending",
            title: "Ending",
            pageType: "ending" as const,
            fields: [],
          },
        ];

  return source.map((page, index) => ({
    id: page.id,
    pageType: (page.pageType ?? "page") as PageType,
    title:
      page.title?.trim() || PAGE_TYPE_LABEL[(page.pageType ?? "page") as PageType],
    x: index * H_GAP,
    y: 0,
  }));
}
