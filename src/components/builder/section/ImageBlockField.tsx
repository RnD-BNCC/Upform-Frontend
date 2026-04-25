import { useState } from "react";
import { motion } from "framer-motion";
import { ImageIcon } from "@phosphor-icons/react";
import { ImagePickerModal } from "@/components/modal";
import { ResizableImage } from "../utils/ResizableImage";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import type { FormField } from "@/types/form";

type ImageBlockFieldCardProps = {
  dragHandle: React.ReactNode;
  field: FormField;
  isSelected: boolean;
  onChange: (updates: Partial<FormField>) => void;
  onSelect: () => void;
};

export function ImageBlockFieldCard({
  dragHandle,
  field,
  isSelected,
  onChange,
  onSelect,
}: ImageBlockFieldCardProps) {
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  return (
    <>
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
            {field.headerImage ? (
              <ResizableImage
                src={field.headerImage}
                imageWidth={field.imageWidth}
                imageAlign={field.imageAlign}
                imageCaption={field.imageCaption}
                onChangeImage={() => setIsImagePickerOpen(true)}
                onUpdate={onChange}
                onRemove={() =>
                  onChange({
                    headerImage: undefined,
                    imageCaption: undefined,
                  })
                }
              />
            ) : (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setIsImagePickerOpen(true);
                }}
                className="flex h-28 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-500"
              >
                <ImageIcon size={20} />
                <span className="text-sm">Click to add image</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        showIconTab={false}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={(url) =>
          onChange({
            headerImage: url,
            ...(field.headerImage
              ? {}
              : { imageWidth: 100, imageAlign: "left" as const }),
          })
        }
      />
    </>
  );
}

export const imageBlockFieldPlugin = createFieldPlugin({
  type: "image_block",
  meta: {
    Icon: ImageIcon,
    iconBg: "bg-gray-100 text-gray-500",
    label: "Image",
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
      label: "Image",
      order: 40,
      action: "upload_image",
    },
  ],
  createField: createFieldFactory("image_block", {
    label: "",
    required: false,
  }),
  renderCard: ({ dragHandle, field, isSelected, onChange, onSelect }) => (
    <ImageBlockFieldCard
      dragHandle={dragHandle}
      field={field}
      isSelected={isSelected}
      onChange={onChange}
      onSelect={onSelect}
    />
  ),
});
