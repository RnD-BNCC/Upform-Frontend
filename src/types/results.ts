import type { FieldType } from "./form";

export type ResultsSection = "database" | "submissions" | "inProgress" | "summary" | "analytics";

export type ResultFilterOperator =
  | "contains"
  | "not_contains"
  | "equals"
  | "not_equals"
  | "is_empty"
  | "is_filled";

export type ResultFilterLogic = "and" | "or";

export type ResultFilterCondition = {
  id: string;
  type: "condition";
  fieldId: string;
  operator: ResultFilterOperator;
  value: string;
};

export type ResultFilterGroup = {
  id: string;
  type: "group";
  logic: ResultFilterLogic;
  items: ResultFilterNode[];
};

export type ResultFilterNode = ResultFilterCondition | ResultFilterGroup;

export type ResultSortDirection = "asc" | "desc";

export type ResultSortRule = {
  id: string;
  fieldId: string;
  direction: ResultSortDirection;
};

export type ResultDatabaseView = {
  id: string;
  name: string;
  fieldOrder: string[];
  hiddenFieldIds: string[];
  sortRules: ResultSortRule[];
  filterGroup: ResultFilterGroup;
};

export type ResultFieldColumn = {
  id: string;
  label: string;
  type: FieldType | "id";
  width: number;
};

export type ResultsAnswerValue = string | string[] | undefined;
