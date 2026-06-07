import type { ReactNode } from "react";
import type { BuilderPageType } from "@/types/builder";
import {
  CoverPageIcon,
  EndingPageIcon,
  FormPageIcon,
} from "@/components/icons";

export const PAGE_TYPE_BADGE_CLASS: Record<BuilderPageType, string> = {
  cover: "bg-blue-100 text-blue-600",
  page: "bg-amber-100 text-amber-600",
  ending: "bg-rose-100 text-rose-600",
};

export const PAGE_TYPE_ICON_CLASS: Record<BuilderPageType, string> = {
  cover: "text-blue-500",
  page: "text-amber-500",
  ending: "text-rose-500",
};

export const PAGE_TYPE_ICONS: Record<BuilderPageType, ReactNode> = {
  cover: <CoverPageIcon />,
  page: <FormPageIcon />,
  ending: <EndingPageIcon />,
};
