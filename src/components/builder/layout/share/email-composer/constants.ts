import {
  FileTextIcon,
  ImageIcon,
  MinusIcon,
  TextAlignLeftIcon,
} from "@phosphor-icons/react";
import type { EmailBlock } from "@/types/builderShare";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const BLOCK_OPTIONS = [
  { type: "text" as const, icon: TextAlignLeftIcon, label: "Text" },
  { type: "image" as const, icon: ImageIcon, label: "Image" },
  { type: "spacer" as const, icon: MinusIcon, label: "Spacer" },
] as const;

export const BLOCK_ICON_CLASS_BY_TYPE: Record<EmailBlock["type"], string> = {
  image: "border border-emerald-500 bg-emerald-50 text-emerald-600",
  spacer: "border border-rose-200 bg-rose-50 text-rose-500",
  text: "border border-primary-500 bg-primary-50 text-primary-600",
};

export const DEFAULT_EMAIL_IMAGE_URL =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80";
export const DEFAULT_IMAGE_MAX_HEIGHT = 200;
export const DEFAULT_IMAGE_WIDTH = 80;

export const EMAIL_STYLE_OPTIONS = [
  { label: "Formatted", value: "formatted", Icon: FileTextIcon },
  { label: "Basic", value: "basic", Icon: FileTextIcon },
] as const;
