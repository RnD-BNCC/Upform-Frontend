export const OPEN_LOGIC_MODAL_EVENT = "upform:open-logic-modal";

export type LogicModalRequestedTab = "pageLogic" | "calculations";

export type OpenLogicModalDetail = {
  tab?: LogicModalRequestedTab;
};

export function emitOpenLogicModal(
  tab: LogicModalRequestedTab = "pageLogic",
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<OpenLogicModalDetail>(OPEN_LOGIC_MODAL_EVENT, {
      detail: { tab },
    }),
  );
}
