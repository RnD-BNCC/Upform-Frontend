import type { FormCalculation, FormField, FormSection } from "@/types/form";
import { getVisibleFields } from "./fieldVisibility";
import { resolvePageLogicNextSectionId } from "./pageLogic";

export type RuntimeNextTarget =
  | { kind: "section"; index: number }
  | { kind: "ending"; sectionId?: string }
  | { kind: "complete" };

function resolveTargetFromSectionId(
  sections: FormSection[],
  targetSectionId: string | undefined,
): RuntimeNextTarget | null {
  if (!targetSectionId) return null;

  if (targetSectionId === "end") {
    return { kind: "ending" };
  }

  const targetIndex = sections.findIndex((section) => section.id === targetSectionId);
  if (targetIndex === -1) return null;

  return sections[targetIndex]?.pageType === "ending"
    ? { kind: "ending", sectionId: targetSectionId }
    : { kind: "section", index: targetIndex };
}

export function getRuntimeEndingSection(
  sections: FormSection[],
  sectionId?: string,
) {
  if (sectionId) {
    const matchedSection = sections.find((section) => section.id === sectionId);
    if (matchedSection?.pageType === "ending") {
      return matchedSection;
    }
  }

  return sections.find((section) => section.pageType === "ending");
}

export function resolveRuntimeNextTarget(
  sections: FormSection[],
  currentSectionId: string,
  visibleFields: FormField[],
  answers: Record<string, string | string[]>,
): RuntimeNextTarget {
  for (const field of visibleFields) {
    if (!field.branches) continue;

    const answer = answers[field.id];
    if (!answer) continue;

    const targetValue = Array.isArray(answer) ? answer[0] : answer;
    const targetSectionId = field.branches[targetValue];
    const resolvedTarget = resolveTargetFromSectionId(sections, targetSectionId);
    if (resolvedTarget) return resolvedTarget;
  }

  const pageLogicTargetId = resolvePageLogicNextSectionId(
    sections,
    currentSectionId,
    answers,
  );
  const pageLogicTarget = resolveTargetFromSectionId(sections, pageLogicTargetId ?? undefined);
  if (pageLogicTarget) return pageLogicTarget;

  const nextSection = getRuntimeSectionAfterCurrent(sections, currentSectionId);
  if (!nextSection) return { kind: "ending" };

  return nextSection.pageType === "ending"
    ? { kind: "ending", sectionId: nextSection.id }
    : {
        kind: "section",
        index: sections.findIndex((section) => section.id === nextSection.id),
      };
}

export function getRuntimeSectionAfterCurrent(
  sections: FormSection[],
  currentSectionId: string,
) {
  const currentIndex = sections.findIndex((section) => section.id === currentSectionId);
  if (currentIndex === -1) return null;

  return sections[currentIndex + 1] ?? null;
}

export function buildRuntimeProgressPath(
  sections: FormSection[],
  answers: Record<string, string | string[]>,
  calculations: FormCalculation[] = [],
) {
  const path: number[] = [];
  const visited = new Set<string>();
  let currentIndex = 0;

  for (let step = 0; step < sections.length + 1; step += 1) {
    const section = sections[currentIndex];
    if (!section || visited.has(section.id)) break;

    path.push(currentIndex);
    visited.add(section.id);

    if (section.pageType === "ending") break;

    const visibleFields = getVisibleFields(section.fields, {
      answers,
      calculations,
    });
    const nextTarget = resolveRuntimeNextTarget(
      sections,
      section.id,
      visibleFields,
      answers,
    );

    if (nextTarget.kind === "section") {
      currentIndex = nextTarget.index;
      continue;
    }

    if (nextTarget.kind === "ending") {
      const endingIndex = nextTarget.sectionId
        ? sections.findIndex((candidate) => candidate.id === nextTarget.sectionId)
        : sections.findIndex((candidate) => candidate.pageType === "ending");

      if (endingIndex >= 0 && !visited.has(sections[endingIndex]?.id ?? "")) {
        path.push(endingIndex);
      }
    }

    break;
  }

  return path;
}

export function getRuntimeProgressPercent({
  answers,
  calculations = [],
  sectionHistory,
  sections,
  submittedEndingSectionId,
}: {
  answers: Record<string, string | string[]>;
  calculations?: FormCalculation[];
  sectionHistory: number[];
  sections: FormSection[];
  submittedEndingSectionId?: string | null;
}) {
  if (sections.length === 0) return 0;

  const path = buildRuntimeProgressPath(sections, answers, calculations);
  const activeSectionIndex = submittedEndingSectionId
    ? sections.findIndex((section) => section.id === submittedEndingSectionId)
    : sectionHistory[sectionHistory.length - 1] ?? 0;
  const activePathIndex = path.findIndex((index) => index === activeSectionIndex);
  const fallbackCurrent = Math.max(1, sectionHistory.length);
  const currentStep =
    activePathIndex >= 0 ? activePathIndex + 1 : fallbackCurrent;
  const totalSteps = Math.max(path.length, fallbackCurrent, 1);

  return Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));
}
