import type { FormField, FormSection } from "@/types/form";

export type EventStatus = "draft" | "active" | "closed";
export type ShareTab = "embed" | "send";
export type EmbedType = "standard" | "popup" | "fullscreen" | "slider";
export type EmbedButtonSize = "default" | "large" | "small";
export type PopupWidth = "small" | "medium" | "large";
export type SliderSide = "left" | "right";

export type ShareToast = (
  message: string,
  type?: "success" | "error" | "info",
  duration?: number,
) => void;

export type BuilderSharePanelProps = {
  activeTheme?: string;
  eventId: string;
  eventStatus: EventStatus;
  formTitle: string;
  isDirty?: boolean;
  isPublishing?: boolean;
  onPublish: () => void;
  publicFormUrl: string;
  sections?: FormSection[];
  showToast?: ShareToast;
};

export type EmailStyle = "formatted" | "basic";
export type RecipientMode = "manual" | "field";
export type ImageAlignment = "left" | "center" | "right" | "full";

export type TextBlock = { id: string; type: "text"; content: string };
export type ImageBlock = {
  align?: ImageAlignment;
  id: string;
  linkUrl?: string;
  maxHeight?: number;
  openLink?: boolean;
  type: "image";
  url: string;
  width?: number;
};
export type SpacerBlock = { id: string; type: "spacer"; height: number };
export type EmailBlock = TextBlock | ImageBlock | SpacerBlock;

export type EmailBlockPatch = Partial<{
  align: ImageAlignment;
  content: string;
  height: number;
  linkUrl: string;
  maxHeight: number;
  openLink: boolean;
  url: string;
  width: number;
}>;

export type EmailComposerScreen = "compose" | "recipients";

export type EmailComposerDraftState = {
  blocks: EmailBlock[];
  emailStyle: EmailStyle;
  emailThemeValue: string | null;
  excludedRecipients: string[];
  manualRecipients: string[];
  recipientMode: RecipientMode;
  selectedEmailFieldIds: string[];
  subject: string;
};

export type EmailFieldSource = {
  emails: string[];
  fieldId: string;
  label: string;
  pageTitle: string;
  type: FormField["type"];
};

export type SendFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  formTitle: string;
  publicFormUrl: string;
  activeTheme?: string;
  sections?: FormSection[];
  showToast?: ShareToast;
};
