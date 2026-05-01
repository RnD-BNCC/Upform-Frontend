import type { ComponentType } from "react";
import type { FieldType } from "@/types/form";
import { getSimilarTypesMap, getFieldTypeMetaMap } from "./fieldRegistry";

export type FieldTypeMeta = {
  Icon: ComponentType<{ className?: string; size?: number }>;
  iconBg: string;
  label: string;
};

export const FIELD_TYPE_META: Partial<Record<FieldType, FieldTypeMeta>> =
  getFieldTypeMetaMap();

export const SIMILAR_TYPES: Partial<Record<FieldType, FieldType[]>> =
  getSimilarTypesMap();
