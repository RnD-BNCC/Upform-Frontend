import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormField } from "@/types/form";
import type { ConditionFieldGroup } from "@/utils/form/conditionFields";
import ReferencePickerPopover from "./ReferencePickerPopover";
import {
  createCalculationReferenceTokenHtml,
  createDateReferenceTokenHtml,
  createFieldReferenceTokenHtml,
  hydrateReferenceTokenElements,
  stripHtmlToText,
  type DateReferenceOption,
} from "@/utils/form/referenceTokens";

type Props = {
  allowDateUtilities?: boolean;
  availableFields?: FormField[];
  availableFieldGroups?: ConditionFieldGroup[];
  className?: string;
  multiline?: boolean;
  onBlur?: () => void;
  onChange: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  placeholderClassName?: string;
  stopPropagation?: boolean;
  value: string;
};

function isContentEmpty(value: string) {
  return value.replace(/<br\s*\/?>/gi, "").replace(/<[^>]*>/g, "").trim().length === 0;
}

function hasActiveReferenceTrigger(root: HTMLElement | null) {
  if (!root) return false;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer)) return false;

  const prefixRange = range.cloneRange();
  prefixRange.selectNodeContents(root);
  prefixRange.setEnd(range.startContainer, range.startOffset);

  return /(^|\s)@[^\s@]*$/.test(prefixRange.toString());
}

export default function ReferenceTextEditor({
  allowDateUtilities = true,
  availableFields = [],
  availableFieldGroups,
  className = "",
  multiline = false,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  placeholderClassName = "px-3 py-2 text-xs text-gray-400",
  stopPropagation,
  value,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);
  const lastValueRef = useRef(value);
  const referenceRangeRef = useRef<Range | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const syncHtml = useCallback(
    (nextValue: string) => {
      if (!editorRef.current) return;
      editorRef.current.innerHTML = nextValue;
      hydrateReferenceTokenElements(editorRef.current);
      lastValueRef.current = nextValue;
    },
    [],
  );

  useEffect(() => {
    syncHtml(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!focusedRef.current && lastValueRef.current !== value) {
      syncHtml(value);
    }
  }, [syncHtml, value]);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    hydrateReferenceTokenElements(editorRef.current);
    const nextValue = editorRef.current.innerHTML;
    lastValueRef.current = nextValue;
    onChange(nextValue);
  }, [onChange]);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
    referenceRangeRef.current = null;
  }, []);

  const syncPickerToSelection = useCallback(() => {
    if (!pickerOpen) return;
    if (!hasActiveReferenceTrigger(editorRef.current)) {
      closePicker();
    }
  }, [closePicker, pickerOpen]);

  const insertReferenceToken = useCallback(
    (tokenHtml: string) => {
      if (!editorRef.current) return;

      editorRef.current.focus();
      const selection = window.getSelection();
      if (!selection) return;

      const targetRange =
        referenceRangeRef.current?.cloneRange() ??
        (selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null);

      if (!targetRange) return;

      selection.removeAllRanges();
      selection.addRange(targetRange);

      const range = selection.getRangeAt(0);
      const startContainer = range.startContainer;

      if (startContainer.nodeType === Node.TEXT_NODE) {
        const textNode = startContainer as Text;
        const startOffset = range.startOffset;
        if (startOffset > 0 && textNode.data[startOffset - 1] === "@") {
          textNode.deleteData(startOffset - 1, 1);
          range.setStart(textNode, startOffset - 1);
          range.collapse(true);
        }
      }

      const tokenContainer = document.createElement("div");
      tokenContainer.innerHTML = tokenHtml;
      const tokenElement = tokenContainer.firstElementChild;
      if (!tokenElement) return;

      hydrateReferenceTokenElements(tokenContainer);
      range.insertNode(tokenElement);

      const spacerNode = document.createTextNode(" ");
      tokenElement.after(spacerNode);

      const nextRange = document.createRange();
      nextRange.setStart(spacerNode, spacerNode.data.length);
      nextRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(nextRange);

      emitChange();
      closePicker();
    },
    [closePicker, emitChange],
  );

  const editorText = useMemo(() => isContentEmpty(value), [value]);
  const displayPlaceholder = useMemo(
    () => (placeholder ? stripHtmlToText(placeholder) || placeholder : ""),
    [placeholder],
  );

  return (
    <div ref={containerRef} className="relative">
      {editorText && displayPlaceholder ? (
        <span
          className={`pointer-events-none absolute inset-0 ${placeholderClassName}`}
        >
          {displayPlaceholder}
        </span>
      ) : null}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onClick={stopPropagation ? (event) => event.stopPropagation() : undefined}
        onFocus={() => {
          focusedRef.current = true;
          onFocus?.();
        }}
        onBlur={() => {
          focusedRef.current = false;
          if (editorRef.current && editorRef.current.innerHTML !== value) {
            syncHtml(value);
          }
          onBlur?.();
        }}
        onKeyDown={(event) => {
          if (stopPropagation) event.stopPropagation();
          if (!multiline && event.key === "Enter") {
            event.preventDefault();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === "@") {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              referenceRangeRef.current = selection.getRangeAt(0).cloneRange();
              setPickerOpen(true);
            }
            return;
          }

          syncPickerToSelection();
        }}
        onMouseUp={() => syncPickerToSelection()}
        onInput={() => {
          emitChange();
          syncPickerToSelection();
        }}
        onPaste={(event) => {
          event.preventDefault();
          document.execCommand(
            "insertText",
            false,
            event.clipboardData.getData("text/plain"),
          );
          emitChange();
          syncPickerToSelection();
        }}
        className={`relative z-[1] min-h-[34px] w-full cursor-text rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-300 ${multiline ? "min-h-[72px] whitespace-pre-wrap" : "whitespace-nowrap"} ${className}`}
      />

      <ReferencePickerPopover
        allowDateUtilities={allowDateUtilities}
        anchorEl={containerRef.current}
        autoFocusSearch={false}
        availableFields={availableFields}
        fieldGroups={availableFieldGroups}
        open={pickerOpen}
        onClose={closePicker}
        onSelectField={(field) =>
          insertReferenceToken(createFieldReferenceTokenHtml(field))
        }
        onSelectCalculation={(calculation) =>
          insertReferenceToken(createCalculationReferenceTokenHtml(calculation))
        }
        onSelectDate={(option: DateReferenceOption, amount?: number) =>
          insertReferenceToken(createDateReferenceTokenHtml(option, amount))
        }
      />
    </div>
  );
}
