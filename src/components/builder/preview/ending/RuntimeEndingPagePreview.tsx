import type { RefObject } from "react";
import type { FormCalculation, FormSection } from "@/types/form";
import type { ThemeConfig } from "@/utils/form/themeConfig";
import RuntimeSectionFields from "../shared/RuntimeSectionFields";

type Props = {
  answers: Record<string, string | string[]>;
  calculations: FormCalculation[];
  emptyMessage: string;
  errors: Record<string, string>;
  fieldsRef: RefObject<Record<string, HTMLDivElement | null>>;
  isSubmittedView?: boolean;
  isLightTheme?: boolean;
  onAnimationComplete: (fieldId: string) => void;
  onAnswer: (fieldId: string, value: string | string[]) => void;
  onFillAgain?: () => void;
  onOtherTextChange: (fieldId: string, text: string) => void;
  otherTexts: Record<string, string>;
  section: FormSection;
  shakeIds: Set<string>;
  themeConfig: ThemeConfig;
};

export default function RuntimeEndingPagePreview(props: Props) {
  return <RuntimeSectionFields {...props} />;
}
