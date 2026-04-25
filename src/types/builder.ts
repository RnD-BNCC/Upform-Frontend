import type { ComponentType, HTMLAttributes, ReactNode } from "react";
import type { ConditionFieldGroup } from "@/utils/form/conditionFields";
import type { FieldType, FormField, FormSection } from "@/types/form";

export type FieldPluginIconProps = {
  className?: string;
  size?: number;
};

export type FieldPluginMeta = {
  Icon: ComponentType<FieldPluginIconProps>;
  iconBg: string;
  label: string;
  similarTypes?: FieldType[];
};

export type FieldPluginSettings = {
  caption?: boolean;
  defaultValue?: boolean;
  displayOnly?: boolean;
  halfWidth?: boolean;
  logic?: boolean;
  placeholder?: boolean;
};

export type FieldPluginBuilderRenderProps = {
  availableReferenceFieldGroups: ConditionFieldGroup[];
  availableReferenceFields: FormField[];
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
  resolvedDefaultValue: string;
  resolvedPlaceholder: string;
  sections: FormSection[];
};

export type FieldPluginCardRenderProps = {
  availableReferenceFieldGroups: ConditionFieldGroup[];
  availableReferenceFields: FormField[];
  dragHandle: ReactNode;
  dragListeners: HTMLAttributes<HTMLDivElement>;
  field: FormField;
  isSelected: boolean;
  onChange: (updates: Partial<FormField>) => void;
  onSelect: () => void;
  resolvedDefaultValue: string;
  resolvedDescription: string;
  resolvedDescriptionHtml: string;
  resolvedLabelHtml: string;
  resolvedPlaceholder: string;
  sectionType?: "page" | "ending" | "cover";
};

export type FieldPluginSettingsRenderProps = {
  availableFieldGroups: ConditionFieldGroup[];
  availableFields: FormField[];
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
};

export type FieldPluginSettingsSectionKey =
  | "advanced"
  | "basic"
  | "fileSize"
  | "options"
  | "validation";

export type FieldPluginSettingsSections = Partial<
  Record<FieldPluginSettingsSectionKey, ReactNode>
>;

export type FieldPalettePlacement = "builder" | "ending";

export type FieldPaletteEntry = {
  action?: "add" | "upload_image";
  category: string;
  label?: string;
  order?: number;
  placement: FieldPalettePlacement;
};

export type CreateFieldOptions = {
  id?: string;
  initialImageUrl?: string;
  overrides?: Partial<FormField>;
};

export type FieldPlugin = {
  createField?: (options?: CreateFieldOptions) => FormField;
  meta: FieldPluginMeta;
  palettes?: FieldPaletteEntry[];
  renderBuilder?: (props: FieldPluginBuilderRenderProps) => ReactNode;
  renderCard?: (props: FieldPluginCardRenderProps) => ReactNode;
  renderSettings?: (props: FieldPluginSettingsRenderProps) => ReactNode;
  renderSettingsSections?: (
    props: FieldPluginSettingsRenderProps,
  ) => FieldPluginSettingsSections;
  settings?: FieldPluginSettings;
  type: FieldType;
};

export type FieldPaletteItem = {
  Icon: ComponentType<FieldPluginIconProps>;
  action: "add" | "upload_image";
  iconBg: string;
  label: string;
  type: FieldType;
};

export type FieldPaletteGroup = {
  items: FieldPaletteItem[];
  label: string;
};

export type BuilderPageType = "cover" | "page" | "ending";

export type SectionPageType = NonNullable<FormSection["pageType"]>;
