import { motion } from "framer-motion";
import { TextHOneIcon } from "@phosphor-icons/react";
import RichInput from "../utils/RichInput";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import type { ConditionFieldGroup } from "@/utils/form/conditionFields";
import type { FormField } from "@/types/form";

type TitleBlockFieldCardProps = {
  availableReferenceFieldGroups: ConditionFieldGroup[];
  availableReferenceFields: FormField[];
  dragHandle: React.ReactNode;
  field: FormField;
  isSelected: boolean;
  onChange: (updates: Partial<FormField>) => void;
  onSelect: () => void;
};

export function TitleBlockFieldCard({
  availableReferenceFieldGroups,
  availableReferenceFields,
  dragHandle,
  field,
  isSelected,
  onChange,
  onSelect,
}: TitleBlockFieldCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      onClickCapture={onSelect}
      className={`relative cursor-pointer rounded-xl bg-white transition-all duration-150 ${
        isSelected
          ? "ring-2 ring-primary-400"
          : "hover:ring-2 hover:ring-primary-200"
      }`}
    >
      <div className="flex">
        {dragHandle}
        <div
          className="min-w-0 flex-1 py-4 pr-5"
          onClick={(event) => event.stopPropagation()}
        >
          <RichInput
            value={field.label}
            onChange={(value) => onChange({ label: value })}
            placeholder="Title"
            referenceFields={availableReferenceFields}
            referenceFieldGroups={availableReferenceFieldGroups}
            className="w-full border-b border-transparent pb-1 text-lg font-semibold text-gray-900 transition-colors hover:border-gray-200 focus:border-primary-400"
            stopPropagation
          />
          {field.headerImage && (
            <div className="group/img relative mb-1 mt-2 overflow-hidden rounded-lg">
              <img
                src={field.headerImage}
                className="max-h-40 w-full rounded-lg object-cover"
                alt=""
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-colors group-hover/img:bg-black/30 group-hover/img:opacity-100">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange({ headerImage: undefined });
                  }}
                  className="rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-white"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const titleBlockFieldPlugin = createFieldPlugin({
  type: "title_block",
  meta: {
    Icon: TextHOneIcon,
    iconBg: "bg-gray-100 text-gray-500",
    label: "Heading",
  },
  settings: {
    displayOnly: true,
    halfWidth: true,
    logic: false,
  },
  palettes: [
    {
      placement: "builder",
      category: "Display text",
      label: "Heading",
      order: 10,
    },
    {
      placement: "ending",
      category: "Content",
      label: "Heading",
      order: 20,
    },
  ],
  createField: createFieldFactory("title_block", {
    label: "",
    required: false,
  }),
  renderCard: ({
    availableReferenceFieldGroups,
    availableReferenceFields,
    dragHandle,
    field,
    isSelected,
    onChange,
    onSelect,
  }) => (
    <TitleBlockFieldCard
      availableReferenceFieldGroups={availableReferenceFieldGroups}
      availableReferenceFields={availableReferenceFields}
      dragHandle={dragHandle}
      field={field}
      isSelected={isSelected}
      onChange={onChange}
      onSelect={onSelect}
    />
  ),
});
