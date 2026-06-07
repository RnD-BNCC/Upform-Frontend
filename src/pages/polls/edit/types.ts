import type { Poll } from "@/types/polling";

export type EditorSaveStatus = "error" | "saved" | "saving" | "unsaved";

export type PollEditorRouteState = {
  isNewDraft?: boolean;
  poll?: Poll;
  selectedIndex?: number;
};

