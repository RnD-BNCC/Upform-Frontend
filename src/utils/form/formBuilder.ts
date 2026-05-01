import type { FormField, FormSection, PageLogicConfig } from "@/types/form";

export function buildRows(fields: FormField[]): FormField[][] {
  const rows: FormField[][] = [];
  let index = 0;

  while (index < fields.length) {
    const current = fields[index];
    const next = fields[index + 1];

    if (
      current.type !== "next_button" &&
      current.fieldWidth === "half" &&
      next?.fieldWidth === "half" &&
      next.type !== "next_button" &&
      current.rowId &&
      current.rowId === next.rowId
    ) {
      rows.push([current, next]);
      index += 2;
      continue;
    }

    rows.push([current]);
    index += 1;
  }

  return rows;
}

export function getVerticalInsertIndex(
  overIndex: number,
  overRect: { top: number; height: number },
  activeRect?: { top: number; height: number } | null,
) {
  const dragMidY = activeRect
    ? activeRect.top + activeRect.height / 2
    : overRect.top + overRect.height;

  return dragMidY <= overRect.top + overRect.height / 2
    ? overIndex
    : overIndex + 1;
}

export function ensureNextButton(sections: FormSection[]): FormSection[] {
  return sections.map((section) => {
    if (section.pageType !== "page") return section;

    const hasNextButton = section.fields.some(
      (field) => field.type === "next_button",
    );
    if (hasNextButton) return section;

    const nextButtonSettings = section.settings?.nextButton as
      | { text?: string; align?: string; color?: string }
      | undefined;

    const nextButton: FormField = {
      id: `__next_${section.id}`,
      type: "next_button",
      label: nextButtonSettings?.text || "",
      required: false,
      buttonAlign:
        (nextButtonSettings?.align as FormField["buttonAlign"]) || "left",
      buttonColor: nextButtonSettings?.color,
    };

    return { ...section, fields: [...section.fields, nextButton] };
  });
}

function getSafeId(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function getUniqueId(candidate: string, usedIds: Set<string>) {
  let nextId = candidate;
  let suffix = 1;

  while (usedIds.has(nextId)) {
    nextId = `${candidate}:${suffix}`;
    suffix += 1;
  }

  usedIds.add(nextId);
  return nextId;
}

function normalizePageLogicConfig(
  sectionId: string,
  pageLogic: PageLogicConfig | undefined,
  usedBranchIds: Set<string>,
): PageLogicConfig | undefined {
  if (!pageLogic) return undefined;

  return {
    ...pageLogic,
    ...(pageLogic.defaultBranchId !== undefined
      ? {
          defaultBranchId: getUniqueId(
            getSafeId(pageLogic.defaultBranchId, `default:${sectionId}`),
            usedBranchIds,
          ),
        }
      : {}),
    conditionalBranches: pageLogic.conditionalBranches?.map((branch, index) => ({
      ...branch,
      id: getUniqueId(
        getSafeId(branch.id, `cond:${sectionId}:${index}`),
        usedBranchIds,
      ),
    })),
  };
}

export function normalizeBuilderSections(sections: FormSection[]): FormSection[] {
  const usedSectionIds = new Set<string>();
  const usedFieldIds = new Set<string>();
  const usedBranchIds = new Set<string>();

  return sections.map((section, sectionIndex) => {
    const sectionId = getUniqueId(
      getSafeId(
        section.id,
        `section-${sectionIndex}-${crypto.randomUUID()}`,
      ),
      usedSectionIds,
    );
    const nextButtonId = `__next_${sectionId}`;

    const fields = (section.fields ?? []).map((field, fieldIndex) => {
      const fieldId =
        field.type === "next_button"
          ? getUniqueId(nextButtonId, usedFieldIds)
          : getUniqueId(
              getSafeId(
                field.id,
                `field-${sectionId}-${fieldIndex}-${crypto.randomUUID()}`,
              ),
              usedFieldIds,
            );

      return {
        ...field,
        id: fieldId,
      };
    });

    const pageLogic = normalizePageLogicConfig(
      sectionId,
      section.settings?.pageLogic as PageLogicConfig | undefined,
      usedBranchIds,
    );

    return {
      ...section,
      id: sectionId,
      fields,
      settings:
        section.settings || pageLogic
          ? {
              ...(section.settings ?? {}),
              ...(pageLogic ? { pageLogic } : {}),
            }
          : section.settings,
    };
  });
}
