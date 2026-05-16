import type {
  ConditionGroup,
  ConditionNode,
  FormField,
  FormSection,
} from "@/types/form";
import { REFERENCE_TOKEN_SELECTOR } from "./referenceTokens";

type FieldIdMap = Map<string, string>;
type RowIdMap = Map<string, string>;

type CloneFieldOptions = {
  fieldIdMap: FieldIdMap;
  rowIdMap?: RowIdMap;
  stripLogic?: boolean;
};

function uid() {
  return crypto.randomUUID();
}

function getMappedId(map: Map<string, string>, value: string) {
  return map.get(value) ?? value;
}

function getMappedRowId(rowId: string | undefined, rowIdMap: RowIdMap) {
  if (!rowId) return undefined;
  const existing = rowIdMap.get(rowId);
  if (existing) return existing;
  const next = uid();
  rowIdMap.set(rowId, next);
  return next;
}

function remapReferenceHtml(value: string | undefined, fieldIdMap: FieldIdMap) {
  if (!value || fieldIdMap.size === 0) return value;

  if (typeof document === "undefined") {
    let nextValue = value;
    for (const [sourceId, targetId] of fieldIdMap) {
      nextValue = nextValue.replaceAll(
        `data-reference-id="${sourceId}"`,
        `data-reference-id="${targetId}"`,
      );
      nextValue = nextValue.replaceAll(
        `data-reference-id='${sourceId}'`,
        `data-reference-id='${targetId}'`,
      );
    }
    return nextValue;
  }

  const container = document.createElement("div");
  container.innerHTML = value;
  container.querySelectorAll<HTMLElement>(REFERENCE_TOKEN_SELECTOR).forEach((element) => {
    if (element.dataset.referenceKind !== "field") return;
    const nextId = fieldIdMap.get(element.dataset.referenceId ?? "");
    if (nextId) element.dataset.referenceId = nextId;
  });
  return container.innerHTML;
}

function remapConditionNode(
  node: ConditionNode | undefined,
  fieldIdMap: FieldIdMap,
): ConditionNode | undefined {
  if (!node) return undefined;

  if (node.type === "condition") {
    const sourceKind = node.sourceKind ?? "field";
    if (sourceKind !== "field") return { ...node };
    return {
      ...node,
      fieldId: getMappedId(fieldIdMap, node.fieldId),
      value: remapReferenceHtml(node.value, fieldIdMap),
    };
  }

  return {
    ...node,
    items: node.items
      .map((item) => remapConditionNode(item, fieldIdMap))
      .filter((item): item is ConditionNode => Boolean(item)),
  };
}

function remapConditionGroup(
  group: ConditionGroup | undefined,
  fieldIdMap: FieldIdMap,
) {
  const remapped = remapConditionNode(group, fieldIdMap);
  return remapped?.type === "group" ? remapped : undefined;
}

function cloneFormField(
  field: FormField,
  { fieldIdMap, rowIdMap = new Map(), stripLogic }: CloneFieldOptions,
): FormField {
  const nextField: FormField = {
    ...field,
    id: getMappedId(fieldIdMap, field.id),
    label: remapReferenceHtml(field.label, fieldIdMap) ?? field.label,
    description: remapReferenceHtml(field.description, fieldIdMap),
    placeholder: remapReferenceHtml(field.placeholder, fieldIdMap),
    defaultValue: remapReferenceHtml(field.defaultValue, fieldIdMap),
    rowId: getMappedRowId(field.rowId, rowIdMap),
  };

  if (stripLogic) {
    delete nextField.branches;
    delete nextField.conditionTree;
    delete nextField.conditions;
    return nextField;
  }

  nextField.conditionTree = remapConditionGroup(field.conditionTree, fieldIdMap);
  nextField.conditions = field.conditions?.map((condition) => ({
    ...condition,
    fieldId: getMappedId(fieldIdMap, condition.fieldId),
  }));

  return nextField;
}

export function cloneFieldForBuilderDuplicate(field: FormField) {
  return cloneFormField(field, {
    fieldIdMap: new Map([[field.id, uid()]]),
  });
}

export function cloneFieldsForImport(fields: FormField[]) {
  const importableFields = fields.filter((field) => field.type !== "next_button");
  const fieldIdMap = new Map(importableFields.map((field) => [field.id, uid()]));
  const rowIdMap = new Map<string, string>();

  return importableFields.map((field) =>
    cloneFormField(field, {
      fieldIdMap,
      rowIdMap,
      stripLogic: true,
    }),
  );
}

export function cloneSectionForBuilderDuplicate(section: FormSection) {
  const nextSectionId = uid();
  const fieldIdMap = new Map(
    section.fields.map((field) => [
      field.id,
      field.type === "next_button" ? `__next_${nextSectionId}` : uid(),
    ]),
  );
  const rowIdMap = new Map<string, string>();

  return {
    ...section,
    id: nextSectionId,
    fields: section.fields.map((field) =>
      cloneFormField(field, { fieldIdMap, rowIdMap }),
    ),
  };
}
