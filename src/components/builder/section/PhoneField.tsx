import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CaretDownIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
} from "@phosphor-icons/react";
import { BUILDER_PHONE_COUNTRIES, getCountryByCode } from "@/constants";
import {
  createFieldFactory,
  createFieldPlugin,
} from "./fieldDefinitionHelpers";
import { FieldPluginTextValidationFields } from "./FieldSettingSections";
import { FieldPluginLabel } from "./FieldSettingControls";
import { sanitizePhoneNumber } from "@/utils/form/phoneAnswer";

type Props = {
  countryCode?: string;
  defaultValue?: string;
  hasError?: boolean;
  onChange: (value: string) => void;
  onCountryChange?: (value: string) => void;
  placeholder?: string;
};

type CountrySelectProps = {
  className?: string;
  onChange: (value: string) => void;
  showSelectedFlagOnly?: boolean;
  value?: string;
};

type CountryMenuPosition = {
  left: number;
  maxHeight: number;
  placement: "bottom" | "top";
  top: number;
  width: number;
};

function FlagImage({ code }: { code: string }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt=""
      className="h-3.5 w-5 rounded-[2px] object-cover shadow-sm"
      loading="lazy"
    />
  );
}

function PhoneCountrySelect({
  className = "",
  onChange,
  showSelectedFlagOnly = false,
  value,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<CountryMenuPosition | null>(
    null,
  );
  const selectedCode = value ?? "US";
  const selectedCountry =
    getCountryByCode(selectedCode) ?? BUILDER_PHONE_COUNTRIES[0];
  const triggerClassName = showSelectedFlagOnly
    ? "theme-answer-addon flex min-h-11 w-20 shrink-0 items-center justify-center gap-2 self-stretch border-r px-3 text-left outline-none transition-colors"
    : "flex h-8 w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-left outline-none transition-colors hover:border-gray-300 focus:border-primary-400 focus:ring-1 focus:ring-primary-300";
  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return BUILDER_PHONE_COUNTRIES;
    }

    return BUILDER_PHONE_COUNTRIES.filter((country) => {
      const haystack =
        `${country.name} ${country.code} ${country.dial}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const updateMenuPosition = () => {
      const trigger = containerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 8;
      const preferredWidth = showSelectedFlagOnly ? 288 : rect.width;
      const width = Math.min(
        Math.max(preferredWidth, 240),
        window.innerWidth - viewportPadding * 2,
      );
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const placement =
        spaceBelow >= 260 || spaceBelow >= spaceAbove ? "bottom" : "top";
      const maxHeight = Math.max(
        180,
        Math.min(320, placement === "bottom" ? spaceBelow : spaceAbove),
      );
      const left = Math.min(
        Math.max(viewportPadding, rect.left),
        window.innerWidth - width - viewportPadding,
      );
      const top =
        placement === "bottom"
          ? rect.bottom + 4
          : Math.max(viewportPadding, rect.top - maxHeight - 4);

      setMenuPosition({ left, maxHeight, placement, top, width });
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    updateMenuPosition();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, showSelectedFlagOnly]);

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className={triggerClassName}
      >
        <FlagImage code={selectedCountry.code} />
        {!showSelectedFlagOnly ? (
          <span className="theme-answer-text max-w-40 truncate text-xs font-medium text-gray-700">
            {selectedCountry.name}
          </span>
        ) : null}
        <CaretDownIcon
          size={10}
          className={`theme-answer-placeholder shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[9999] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
              style={{
                left: menuPosition.left,
                maxHeight: menuPosition.maxHeight,
                top: menuPosition.top,
                width: menuPosition.width,
              }}
            >
              <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                <MagnifyingGlassIcon size={13} className="text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  placeholder="Search country"
                  className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-300"
                  autoFocus
                />
              </div>
              <div
                className="overflow-y-auto py-1"
                style={{
                  maxHeight: Math.max(120, menuPosition.maxHeight - 41),
                }}
              >
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => {
                    const isSelected = country.code === selectedCountry.code;

                    return (
                      <button
                        key={country.code}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onChange(country.code);
                          setQuery("");
                          setOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? "bg-primary-50 font-semibold text-primary-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="min-w-0 truncate">{country.name}</span>
                        <span className="shrink-0 text-gray-400">
                          {country.dial}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-3 text-xs text-gray-400">
                    No countries found
                  </p>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default function PhoneField({
  countryCode,
  defaultValue,
  hasError = false,
  onChange,
  onCountryChange,
  placeholder,
}: Props) {
  const [runtimeCountryCode, setRuntimeCountryCode] = useState(
    countryCode ?? "US",
  );
  const isCountryControlled = typeof onCountryChange === "function";
  const selectedCountryCode = isCountryControlled
    ? countryCode ?? runtimeCountryCode
    : runtimeCountryCode;
  const phoneValue = sanitizePhoneNumber(defaultValue ?? "");

  useEffect(() => {
    setRuntimeCountryCode(countryCode ?? "US");
  }, [countryCode]);

  const handleCountryChange = (value: string) => {
    setRuntimeCountryCode(value);
    onCountryChange?.(value);
  };
  const handlePhoneChange = (value: string) => {
    onChange(sanitizePhoneNumber(value));
  };

  return (
    <div
      className={`theme-answer-input flex min-h-11 items-stretch overflow-hidden rounded-lg border bg-white transition-colors ${
        hasError
          ? "border-red-400 focus-within:border-red-500"
          : "border-gray-200 hover:border-gray-300 focus-within:border-primary-400"
      }`}
    >
      <PhoneCountrySelect
        onChange={handleCountryChange}
        showSelectedFlagOnly
        value={selectedCountryCode}
      />
      <input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        value={phoneValue}
        placeholder={placeholder || "Phone number"}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => handlePhoneChange(event.target.value)}
        className="theme-answer-placeholder theme-answer-text min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-xs"
      />
    </div>
  );
}

export const phoneFieldPlugin = createFieldPlugin({
  type: "phone",
  meta: {
    Icon: PhoneIcon,
    iconBg: "bg-blue-100 text-blue-600",
    label: "Phone",
    similarTypes: ["short_text", "email"],
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
      category: "Contact Info",
      label: "Phone number",
      order: 20,
    },
  ],
  createField: createFieldFactory("phone", {
    countryCode: "US",
    label: "Phone",
    required: false,
  }),
  renderBuilder: ({
    field,
    onChange,
    resolvedDefaultValue,
    resolvedPlaceholder,
  }) => (
    <PhoneField
      countryCode={field.countryCode}
      defaultValue={resolvedDefaultValue}
      onChange={(value) => onChange({ defaultValue: value || undefined })}
      onCountryChange={(value) => onChange({ countryCode: value })}
      placeholder={resolvedPlaceholder}
    />
  ),
  renderSettingsSections: ({ field, onChange }) => ({
    basic: (
      <div>
        <FieldPluginLabel>Country</FieldPluginLabel>
        <PhoneCountrySelect
          className="w-full"
          showSelectedFlagOnly={false}
          value={field.countryCode ?? "US"}
          onChange={(value) => onChange({ countryCode: value })}
        />
      </div>
    ),
    validation: (
      <FieldPluginTextValidationFields field={field} onChange={onChange} />
    ),
  }),
});
