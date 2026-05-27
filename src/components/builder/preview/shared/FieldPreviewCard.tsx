import { getFieldPlugin } from "@/components/builder/section/fieldRegistry";
import PreviewField from "@/components/builder/preview/shared/PreviewField";
import type { FormField } from "@/types/form";

type Props = {
  field?: FormField;
  label?: string;
};

function getFieldTypeLabel(field: FormField) {
  return getFieldPlugin(field.type)?.meta.label ?? field.type.replaceAll("_", " ");
}

export function FieldPreviewCard({ field, label }: Props) {
  if (!field) return null;

  const meta = getFieldPlugin(field.type)?.meta;
  const Icon = meta?.Icon;

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
      {label ? (
        <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-gray-400">
          {label}
        </p>
      ) : null}
      <div className="mb-3 flex items-center gap-2">
        {Icon ? (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
              meta?.iconBg ?? "bg-gray-100 text-gray-500"
            }`}
          >
            <Icon size={14} />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black capitalize text-gray-800">
            {getFieldTypeLabel(field)}
          </p>
          <p className="text-[10px] font-semibold text-gray-400">
            {field.required ? "Required" : "Optional"}
          </p>
        </div>
      </div>
      <div className="pointer-events-none overflow-hidden rounded-lg bg-gray-50 p-2 [&_.theme-question-card]:shadow-none">
        <PreviewField
          field={field}
          hasError={false}
          isShaking={false}
          onAnimationComplete={() => undefined}
          onAnswer={() => undefined}
          onOtherTextChange={() => undefined}
          setRef={() => undefined}
          value={field.defaultValue}
        />
      </div>
    </div>
  );
}
