import type { RefObject } from "react";
import type { FormCalculation, FormSection } from "@/types/form";
import type { ThemeConfig } from "@/utils/form/themeConfig";
import RuntimeSectionFields from "../shared/RuntimeSectionFields";

type Props = {
  answers: Record<string, string | string[]>;
  backButtonClassName?: string;
  calculations: FormCalculation[];
  emptyMessage: string;
  errors: Record<string, string>;
  fieldsRef: RefObject<Record<string, HTMLDivElement | null>>;
  isLightTheme?: boolean;
  nextButtonLabel?: string;
  onAnimationComplete: (fieldId: string) => void;
  onAnswer: (fieldId: string, value: string | string[]) => void;
  onBack?: () => void;
  onNext?: () => void;
  onOtherTextChange: (fieldId: string, text: string) => void;
  onSkip?: () => void;
  otherTexts: Record<string, string>;
  pendingFilesRef?: RefObject<Record<string, File[]>>;
  section: FormSection;
  shakeIds: Set<string>;
  showBack?: boolean;
  themeConfig: ThemeConfig;
};

export default function RuntimeFormPagePreview(props: Props) {
  return <RuntimeSectionFields {...props} />;
}
