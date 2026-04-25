import type { RefObject } from "react";
import type { FormField, FormSection } from "@/types/form";
import SectionPreview from "../shared/SectionPreview";
import type { ThemeConfig } from "@/utils/form/themeConfig";

type Props = {
  accentColor?: string;
  activeFieldId: string | null;
  dragInsertIdx: number | null;
  paletteDragType: string | null;
  paletteInsertIdx: number | null;
  questionsEndRef?: RefObject<HTMLDivElement | null>;
  section: FormSection;
  sections: FormSection[];
  selectedId: string | null;
  themeConfig: ThemeConfig;
  onChangeField: (fieldId: string, updates: Partial<FormField>) => void;
  onDeleteField: (fieldId: string) => void;
  onDuplicateField: (fieldId: string) => void;
  onSelectField: (fieldId: string) => void;
};

export default function EndingPagePreview({
  accentColor,
  activeFieldId,
  dragInsertIdx,
  paletteDragType,
  paletteInsertIdx,
  questionsEndRef,
  section,
  sections,
  selectedId,
  themeConfig,
  onChangeField,
  onDeleteField,
  onDuplicateField,
  onSelectField,
}: Props) {
  return (
    <SectionPreview
      accentColor={accentColor}
      activeFieldId={activeFieldId}
      contentClassName="bg-white rounded-xl p-6 flex flex-col gap-2 scheme-light"
      dragInsertIdx={dragInsertIdx}
      emptyMessage="Click a field type on the left to add content"
      pageType="ending"
      paletteDragType={paletteDragType}
      paletteInsertIdx={paletteInsertIdx}
      questionsEndRef={questionsEndRef}
      section={section}
      sections={sections}
      selectedId={selectedId}
      themeConfig={themeConfig}
      onChangeField={onChangeField}
      onDeleteField={onDeleteField}
      onDuplicateField={onDuplicateField}
      onSelectField={onSelectField}
    />
  );
}
