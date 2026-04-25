import { CurrencyDollarIcon } from "@phosphor-icons/react";
import {
  createFieldFactory,
  createFieldPlugin,
} from "./fieldDefinitionHelpers";
import { FieldPluginTextValidationFields } from "./FieldSettingSections";
import { FieldPluginLabel } from "./FieldSettingControls";

const CURRENCY_SYMBOLS: Record<string, string> = {
  AUD: "A$",
  CNY: "Y",
  EUR: "EUR",
  GBP: "GBP",
  IDR: "Rp",
  JPY: "JPY",
  KRW: "KRW",
  MYR: "RM",
  SGD: "S$",
  USD: "$",
};

const CURRENCY_CODES = [
  { code: "USD", label: "USD - US Dollar" },
  { code: "IDR", label: "IDR - Indonesian Rupiah" },
  { code: "EUR", label: "EUR - Euro" },
  { code: "GBP", label: "GBP - British Pound" },
  { code: "JPY", label: "JPY - Japanese Yen" },
  { code: "SGD", label: "SGD - Singapore Dollar" },
  { code: "MYR", label: "MYR - Malaysian Ringgit" },
  { code: "AUD", label: "AUD - Australian Dollar" },
  { code: "CNY", label: "CNY - Chinese Yuan" },
  { code: "KRW", label: "KRW - Korean Won" },
] as const;

type Props = {
  currencyCode?: string;
  defaultValue?: string;
  hasError?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function CurrencyField({
  currencyCode,
  defaultValue,
  hasError = false,
  onChange,
  placeholder,
}: Props) {
  return (
    <div
      className={`theme-answer-input flex min-h-11 items-stretch overflow-hidden rounded-lg border bg-white transition-colors ${
        hasError
          ? "border-red-400 focus-within:border-red-500"
          : "border-gray-200 hover:border-gray-300 focus-within:border-primary-400"
      }`}
    >
      <span className="theme-answer-addon flex w-20 shrink-0 items-center justify-center border-r px-3 text-sm">
        {CURRENCY_SYMBOLS[currencyCode ?? "USD"] ?? "$"}
      </span>
      <input
        type="number"
        value={defaultValue ?? ""}
        onChange={(event) => onChange(event.target.value)}
        onClick={(event) => event.stopPropagation()}
        placeholder={placeholder || "0.00"}
        className="theme-answer-placeholder theme-answer-text min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-xs"
      />
    </div>
  );
}

export const currencyFieldPlugin = createFieldPlugin({
  type: "currency",
  meta: {
    Icon: CurrencyDollarIcon,
    iconBg: "bg-purple-100 text-purple-600",
    label: "Currency",
    similarTypes: ["number"],
  },
  settings: {
    caption: true,
    defaultValue: true,
    halfWidth: true,
    placeholder: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Number",
      label: "Currency",
      order: 20,
    },
  ],
  createField: createFieldFactory("currency", {
    currencyCode: "USD",
    label: "Currency",
    required: false,
  }),
  renderBuilder: ({
    field,
    onChange,
    resolvedDefaultValue,
    resolvedPlaceholder,
  }) => (
    <CurrencyField
      currencyCode={field.currencyCode}
      defaultValue={resolvedDefaultValue}
      onChange={(value) => onChange({ defaultValue: value || undefined })}
      placeholder={resolvedPlaceholder}
    />
  ),
  renderSettingsSections: ({ field, onChange }) => ({
    basic: (
      <div>
        <FieldPluginLabel>Currency</FieldPluginLabel>
        <select
          value={field.currencyCode ?? "USD"}
          onChange={(event) => onChange({ currencyCode: event.target.value })}
          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
        >
          {CURRENCY_CODES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.label}
            </option>
          ))}
        </select>
      </div>
    ),
    validation: (
      <FieldPluginTextValidationFields field={field} onChange={onChange} />
    ),
  }),
});
