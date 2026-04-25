import { useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { FieldType } from "@/types/form";
import { getFieldPaletteGroups } from "@/components/builder/section/fieldRegistry";
import BuilderPaletteItem from "../fields/BuilderPaletteItem";

type Props = {
  hasThankyou?: boolean;
  onAddField?: (type: FieldType) => void;
};

export default function EndingSettingsPanel({
  onAddField,
  hasThankyou,
}: Props) {
  const [search, setSearch] = useState("");
  const categories = getFieldPaletteGroups("ending");
  const normalizedSearch = search.trim().toLowerCase();

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        if (item.type === "thank_you_block" && hasThankyou) {
          return false;
        }

        if (!normalizedSearch) return true;
        return item.label.toLowerCase().includes(normalizedSearch);
      }),
    }))
    .filter((category) => category.items.length > 0);

  return (
    <div className="z-10 flex h-full w-72 shrink-0 flex-col overflow-hidden border-r border-gray-100 bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pb-2 pt-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5">
            <MagnifyingGlassIcon size={13} className="shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Search fields"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {filteredCategories.map((category) => (
          <div key={category.label} className="px-2 pb-4">
            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {category.label}
            </p>
            <div className="grid grid-cols-3 gap-1">
              {category.items.map((item) => {
                const Icon = item.Icon;

                return (
                  <BuilderPaletteItem
                    key={`${category.label}-${item.type}-${item.label}`}
                    label={item.label}
                    icon={<Icon size={15} />}
                    iconBgClassName={item.iconBg}
                    fieldType={item.type}
                    dragId={`${category.label}-${item.type}`}
                    onClick={() => onAddField?.(item.type)}
                    className="flex h-22 flex-col items-center justify-center gap-1.5 p-2"
                    labelClassName="flex min-h-[34px] line-clamp-2 text-center text-[9px] font-medium leading-tight text-gray-600"
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
