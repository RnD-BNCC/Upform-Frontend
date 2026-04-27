import type { ReactNode } from "react";
import type { FormResponse, FormSection } from "./form";

export type GamePanelProps = {
  eventId: string;
  formTitle: string;
  responses: FormResponse[];
  sections: FormSection[];
};

export type GamePluginMeta = {
  description: string;
  label: string;
};

export type GamePlugin = {
  meta: GamePluginMeta;
  renderCard: (props: GamePanelProps) => ReactNode;
  type: string;
};
