import type { FormField, FormSection } from "@/types/form";

export type ConditionFieldGroup = {
  fields: FormField[];
  sectionId: string;
  sectionLabel: string;
};

export const CONDITION_FIELD_TYPE_LABELS: Record<string, string> = {
  short_text: "Short answer",
  paragraph: "Paragraph",
  long_text: "Long answer",
  multiple_choice: "Multiple choice",
  checkbox: "Checkboxes",
  multiselect: "Multiselect",
  dropdown: "Dropdown",
  date: "Date picker",
  time: "Time picker",
  email: "Email",
  file_upload: "File upload",
  rating: "Star rating",
  linear_scale: "Slider",
  title_block: "Heading",
  image_block: "Image",
  banner_block: "Banner",
  ranking: "Ranking",
  opinion_scale: "Opinion scale",
  rich_text: "Rich text",
  phone: "Phone number",
  address: "Address",
  number: "Number",
  currency: "Currency",
  divider: "Divider",
  thank_you_block: "Thank You",
  fill_again_button: "Fill Again Button",
  url_button: "URL Button",
  next_button: "Next Button",
  single_checkbox: "Single Checkbox",
};

const NON_ANSWERABLE_FIELD_TYPES = new Set<FormField["type"]>([
  "image_block",
  "title_block",
  "banner_block",
  "divider",
  "thank_you_block",
  "fill_again_button",
  "url_button",
  "next_button",
  "paragraph",
]);

function isAnswerableField(field: FormField) {
  return !NON_ANSWERABLE_FIELD_TYPES.has(field.type);
}

function getPageLogicSectionLabel(section: FormSection, fallbackIndex: number) {
  const trimmedTitle = section.title?.trim();
  if (trimmedTitle) return trimmedTitle;
  if (section.pageType === "cover") return "Cover";
  if (section.pageType === "ending") return "Ending";
  return `Page ${fallbackIndex + 1}`;
}

function getFlowOrderedSections(sections: FormSection[]): FormSection[] {
  const sectionIds = sections.map((section) => section.id);
  const validIds = new Set(sectionIds);
  const defaultTargets = new Map<string, string>();
  const conditionalTargets = new Map<string, string[]>();
  const orderedIds: string[] = [];
  const visited = new Set<string>();

  sections.forEach((section, index) => {
    if (section.pageType === "ending") return;

    const pageLogic = section.settings?.pageLogic;
    const fallbackTargetId = sections[index + 1]?.id;
    const explicitDefaultTargetId =
      typeof pageLogic?.defaultTargetId === "string"
        ? pageLogic.defaultTargetId
        : undefined;
    const hasExplicitDefaultTarget =
      !!explicitDefaultTargetId && validIds.has(explicitDefaultTargetId);

    if (hasExplicitDefaultTarget) {
      defaultTargets.set(section.id, explicitDefaultTargetId);
    } else if (pageLogic?.disableDefaultFallback !== true && fallbackTargetId) {
      defaultTargets.set(section.id, fallbackTargetId);
    }

    for (const branch of pageLogic?.conditionalBranches ?? []) {
      if (!branch.toId || !validIds.has(branch.toId)) continue;

      const targets = conditionalTargets.get(section.id) ?? [];
      if (!targets.includes(branch.toId)) {
        targets.push(branch.toId);
      }
      conditionalTargets.set(section.id, targets);
    }
  });

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

  const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
  return [...sections].sort((left, right) => {
    const leftOrder = orderMap.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = orderMap.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}

export function getAvailableConditionFieldGroupsForField(
  sections: FormSection[],
  fieldId: string,
): ConditionFieldGroup[] {
  const orderedSections = getFlowOrderedSections(sections);
  const currentSectionIdx = orderedSections.findIndex((section) =>
    section.fields.some((field) => field.id === fieldId),
  );

  if (currentSectionIdx === -1) return [];

  return orderedSections.flatMap((section, sectionIndex) => {
    if (sectionIndex > currentSectionIdx) return [];

    const fields =
      sectionIndex < currentSectionIdx
        ? section.fields
        : section.fields.slice(
            0,
            Math.max(
              0,
              section.fields.findIndex((field) => field.id === fieldId),
            ),
          );

    const answerableFields = fields.filter(isAnswerableField);
    if (answerableFields.length === 0) return [];

    return [
      {
        sectionId: section.id,
        sectionLabel: getPageLogicSectionLabel(section, sectionIndex),
        fields: answerableFields,
      },
    ];
  });
}

export function getAvailableReferenceFieldGroupsForField(
  sections: FormSection[],
  fieldId: string,
): ConditionFieldGroup[] {
  const orderedSections = getFlowOrderedSections(sections);
  const currentSectionIdx = orderedSections.findIndex((section) =>
    section.fields.some((field) => field.id === fieldId),
  );

  if (currentSectionIdx === -1) return [];

  return orderedSections.flatMap((section, sectionIndex) => {
    if (sectionIndex > currentSectionIdx) return [];

    const answerableFields = section.fields.filter(isAnswerableField);
    if (answerableFields.length === 0) return [];

    return [
      {
        sectionId: section.id,
        sectionLabel: getPageLogicSectionLabel(section, sectionIndex),
        fields: answerableFields,
      },
    ];
  });
}

export function getAvailableConditionFieldGroupsForForm(
  sections: FormSection[],
): ConditionFieldGroup[] {
  return getFlowOrderedSections(sections).flatMap((section, sectionIndex) => {
    const answerableFields = section.fields.filter(isAnswerableField);
    if (answerableFields.length === 0) return [];

    return [
      {
        sectionId: section.id,
        sectionLabel: getPageLogicSectionLabel(section, sectionIndex),
        fields: answerableFields,
      },
    ];
  });
}

export function getAvailableReferenceFieldGroupsForForm(
  sections: FormSection[],
): ConditionFieldGroup[] {
  return getAvailableConditionFieldGroupsForForm(sections);
}

export function getAvailableConditionFieldsForField(
  sections: FormSection[],
  fieldId: string,
): FormField[] {
  return getAvailableConditionFieldGroupsForField(sections, fieldId).flatMap(
    (group) => group.fields,
  );
}

export function getAvailableReferenceFieldsForField(
  sections: FormSection[],
  fieldId: string,
): FormField[] {
  return getAvailableReferenceFieldGroupsForField(sections, fieldId).flatMap(
    (group) => group.fields,
  );
}

export function getAvailableConditionFieldsForForm(sections: FormSection[]) {
  return getAvailableConditionFieldGroupsForForm(sections).flatMap(
    (group) => group.fields,
  );
}

export function getAvailableReferenceFieldsForForm(sections: FormSection[]) {
  return getAvailableReferenceFieldGroupsForForm(sections).flatMap(
    (group) => group.fields,
  );
}

export function getAvailableConditionFieldsForSection(
  sections: FormSection[],
  sectionId: string,
): FormField[] {
  const orderedSections = getFlowOrderedSections(sections);
  const currentSectionIdx = orderedSections.findIndex(
    (section) => section.id === sectionId,
  );

  return orderedSections
    .slice(0, Math.max(0, currentSectionIdx + 1))
    .flatMap((section) => section.fields)
    .filter(isAnswerableField);
}
