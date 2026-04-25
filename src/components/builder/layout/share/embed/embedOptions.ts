import type { ConditionSelectOption } from "@/components/builder/layout/reference/ConditionSelect";

export const EMBED_TYPE_OPTIONS: ConditionSelectOption[] = [
  { value: "standard", label: "Standard" },
  { value: "popup", label: "Popup" },
  { value: "fullscreen", label: "Full screen" },
  { value: "slider", label: "Slider" },
];

export const WIDTH_UNIT_OPTIONS: ConditionSelectOption[] = [
  { value: "%", label: "%" },
  { value: "px", label: "px" },
];

export const BUTTON_SIZE_OPTIONS: ConditionSelectOption[] = [
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
  { value: "small", label: "Small" },
];

export const POPUP_WIDTH_OPTIONS: ConditionSelectOption[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export const SLIDER_SIDE_OPTIONS: ConditionSelectOption[] = [
  { value: "right", label: "Right" },
  { value: "left", label: "Left" },
];
