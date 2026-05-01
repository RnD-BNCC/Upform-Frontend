import { memo } from "react";
import { CheckIcon } from "@phosphor-icons/react";
import type { FormField } from "@/types/form";

type Props = {
  field: FormField;
  canValidate: boolean;
  onChange: (updates: Partial<FormField>) => void;
};

export const ResponseValidation = memo(function ResponseValidation({
  field,
  canValidate,
  onChange,
}: Props) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">Response validation</span>
        {field.correctAnswer !== undefined && (
          <button
            onClick={(e) => { e.stopPropagation(); onChange({ correctAnswer: undefined }); }}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {(field.type === "multiple_choice" ||
        field.type === "checkbox" ||
        field.type === "multiselect") && (
        <>
          <p className="text-xs text-gray-400 mb-2">Tap an option to mark it as the correct answer</p>
          {(field.options ?? []).map((opt, i) => {
            const key = `${i}::${opt}`;
            const isCorrect =
              field.type === "multiple_choice"
                ? field.correctAnswer === key
                : (field.correctAnswer as string[] | undefined)?.includes(key);
            return (
              <div
                key={key}
                onClick={(e) => {
                  e.stopPropagation();
                  if (field.type === "multiple_choice") {
                    onChange({ correctAnswer: isCorrect ? undefined : key });
                  } else {
                    const cur = (field.correctAnswer as string[] | undefined) ?? [];
                    onChange({ correctAnswer: isCorrect ? cur.filter((a) => a !== key) : [...cur, key] });
                  }
                }}
                className="flex items-center gap-2 py-1.5 cursor-pointer group/ak w-full"
              >
                <div
                  className={`w-4 h-4 ${
                    field.type === "multiple_choice" ? "rounded-full" : "rounded"
                  } border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isCorrect ? "border-green-500 bg-green-500" : "border-gray-300 group-hover/ak:border-gray-400"
                  }`}
                >
                  {isCorrect && <CheckIcon size={10} weight="bold" className="text-white" />}
                </div>
                <span className="text-sm text-gray-600">{opt}</span>
              </div>
            );
          })}
        </>
      )}

      {canValidate && (
        <input
          value={typeof field.correctAnswer === "string" ? field.correctAnswer : ""}
          onChange={(e) => onChange({ correctAnswer: e.target.value || undefined })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Correct answer..."
          className="w-full text-sm border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none pb-0.5 transition-colors text-gray-900"
        />
      )}
    </div>
  );
});
