import { useState } from "react";
import { FilePlusIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { FieldType, FormField } from "@/types/form";
import BuilderPaletteItem from "./BuilderPaletteItem";
import { getFieldPaletteGroups } from "@/components/builder/section/fieldRegistry";
import { ImagePickerModal } from "@/components/modal";
import ImportQuestionsModal from "./ImportQuestionsModal";

type Props = {
  currentEventId?: string;
  onAddField: (type: FieldType) => void;
  onAddImageBlock: (url: string) => void;
  onImportFields: (fields: FormField[]) => void;
};

export default function FieldCategoryPanel({
  currentEventId,
  onAddField,
  onAddImageBlock,
  onImportFields,
}: Props) {
  const [search, setSearch] = useState("");
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const categories = getFieldPaletteGroups("builder");
  const normalizedSearch = search.trim().toLowerCase();

  const filteredCategories = normalizedSearch
    ? categories
        .map((category) => ({
          ...category,
          items: category.items.filter((item) =>
            item.label.toLowerCase().includes(normalizedSearch),
          ),
        }))
        .filter((category) => category.items.length > 0)
    : categories;

  return (
    <div className="flex h-full w-72 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-gray-50">
      <div className="bg-gray-50 px-3 pb-2 pt-3">
        <button
          type="button"
          onClick={() => setIsImportModalOpen(true)}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-md border border-primary-100 bg-white px-3 py-2 text-xs font-semibold text-primary-700 shadow-sm transition-colors hover:border-primary-200 hover:bg-primary-50"
        >
          <FilePlusIcon size={15} weight="duotone" />
          Import questions
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5">
          <MagnifyingGlassIcon size={14} className="shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search fields"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        {filteredCategories.map((category) => (
          <div key={category.label}>
            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {category.label}
            </p>
            <div className="grid grid-cols-3 gap-1">
              {category.items.map((item) => {
                const Icon = item.Icon;
                const isUploadAction = item.action === "upload_image";

                return (
                  <BuilderPaletteItem
                    key={`${category.label}-${item.type}-${item.label}`}
                    label={item.label}
                    icon={<Icon size={16} />}
                    iconBgClassName={item.iconBg}
                    dragId={`${category.label}-${item.type}`}
                    onClick={() => {
                      if (isUploadAction) {
                        setIsImagePickerOpen(true);
                        return;
                      }

                      onAddField(item.type);
                    }}
                    fieldType={item.type}
                    disabled={isUploadAction}
                    className="flex h-22 flex-col items-center justify-center gap-1.5 p-2"
                    labelClassName="flex min-h-[34px] line-clamp-2 text-center text-[9px] font-medium leading-tight text-gray-600"
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        showIconTab={false}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={onAddImageBlock}
      />
      {isImportModalOpen ? (
        <ImportQuestionsModal
          currentEventId={currentEventId}
          isOpen
          onClose={() => setIsImportModalOpen(false)}
          onImport={onImportFields}
        />
      ) : null}
    </div>
  );
}
