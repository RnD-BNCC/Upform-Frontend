import { CheckIcon, FileTextIcon } from "@phosphor-icons/react";
import { FIELD_TYPE_META } from "@/components/builder/section/fieldTypeMeta";
import type { FormField } from "@/types/form";
import type { EmailFieldSource } from "@/types/builderShare";

function FieldSourceIcon({ type }: { type: FormField["type"] }) {
  const meta = FIELD_TYPE_META[type];
  const Icon = meta?.Icon ?? FileTextIcon;

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
        meta?.iconBg ?? "bg-gray-100 text-gray-500"
      }`}
    >
      <Icon size={16} />
    </span>
  );
}

type FieldSourceOptionProps = {
  selected: boolean;
  source: EmailFieldSource;
  onToggle: () => void;
};

export default function FieldSourceOption({
  selected,
  source,
  onToggle,
}: FieldSourceOptionProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors ${
        selected
          ? "border-primary-300 bg-primary-50/70"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
          selected
            ? "border-primary-500 bg-primary-600 text-white"
            : "border-gray-300 bg-white text-transparent"
        }`}
      >
        <CheckIcon size={13} weight="bold" />
      </span>
      <FieldSourceIcon type={source.type} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-gray-800">
          {source.label}
        </span>
        <span className="mt-0.5 block truncate text-xs text-gray-400">
          {source.pageTitle}
        </span>
      </span>
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500">
        {source.emails.length}
      </span>
    </button>
  );
}
