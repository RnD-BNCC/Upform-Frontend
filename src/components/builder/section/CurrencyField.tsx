import { CurrencyDollarIcon } from "@phosphor-icons/react";
import {
  createFieldFactory,
  createFieldPlugin,
} from "./fieldDefinitionHelpers";
import { FieldPluginTextValidationFields } from "./FieldSettingSections";
import { FieldPluginLabel } from "./FieldSettingControls";
import DropdownField from "./DropdownField";

const CURRENCY_SYMBOLS: Record<string, string> = {
  AUD: "A$",
  CNY: "¥",
  EUR: "€",
  GBP: "£",
  IDR: "Rp",
  JPY: "¥",
  KRW: "₩",
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

export function normalizeCurrencyInput(value: string) {
  const withoutCommas = value.replace(/,/g, "").trim();
  const isNegative = withoutCommas.startsWith("-");
  const sign = isNegative ? "-" : "";
  const unsigned = withoutCommas.replace(/-/g, "");
  const hasDecimal = unsigned.includes(".");
  const [integerPart = "", ...decimalParts] = unsigned.split(".");
  const integerDigits = integerPart.replace(/\D/g, "");
  const decimalDigits = decimalParts.join("").replace(/\D/g, "");

  if (!integerDigits && !hasDecimal) {
    return "";
  }

  return `${sign}${integerDigits}${hasDecimal ? `.${decimalDigits}` : ""}`;
}

export function formatCurrencyInput(value?: string) {
  const normalized = normalizeCurrencyInput(value ?? "");
  if (!normalized) {
    return "";
  }

  const sign = normalized.startsWith("-") ? "-" : "";
  const unsigned = sign ? normalized.slice(1) : normalized;
  const hasDecimal = unsigned.includes(".");
  const [integerPart = "", decimalPart = ""] = unsigned.split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${sign}${formattedInteger}${hasDecimal ? `.${decimalPart}` : ""}`;
}

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
        type="text"
        inputMode="decimal"
        value={formatCurrencyInput(defaultValue)}
        onChange={(event) => onChange(normalizeCurrencyInput(event.target.value))}
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
        <DropdownField
          defaultValue={field.currencyCode ?? "USD"}
          onChange={(value) => onChange({ currencyCode: value ?? "USD" })}
          options={CURRENCY_CODES.map((currency) => ({
            label: currency.label,
            value: currency.code,
          }))}
          size="compact"
        />
      </div>
    ),
    validation: (
      <FieldPluginTextValidationFields field={field} onChange={onChange} />
    ),
  }),
});
