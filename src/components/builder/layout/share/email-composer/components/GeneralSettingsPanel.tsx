import ConditionSelect, {
  type ConditionSelectOption,
} from "@/components/builder/layout/reference/ConditionSelect";
import {
  THEMES,
  type ResolvedTheme,
  type ThemeConfig,
} from "@/utils/form/themeConfig";
import { EMAIL_STYLE_OPTIONS } from "../constants";
import type { EmailStyle } from "@/types/builderShare";

function ThemeSelectIcon({ theme }: { theme: ThemeConfig }) {
  return (
    <span
      className="flex h-7 w-11 items-center justify-center rounded border text-xs font-semibold shadow-sm"
      style={{
        background: theme.inputBg,
        borderColor: theme.inputBorder,
        color: theme.textColor,
      }}
    >
      <span
        className="mr-1 h-1.5 w-1.5 rounded-full"
        style={{ background: theme.btnBg }}
      />
      Aa
    </span>
  );
}

function getThemeSelectValue(theme: ResolvedTheme) {
  return theme.isCustom ? theme.value : theme.sourceKey;
}

type GeneralSettingsPanelProps = {
  currentFormTheme: ResolvedTheme;
  emailStyle: EmailStyle;
  onEmailStyleChange: (style: EmailStyle) => void;
  onSubjectChange: (value: string) => void;
  onThemeChange: (value: string) => void;
  selectedTheme: ResolvedTheme;
  subject: string;
};

export default function GeneralSettingsPanel({
  currentFormTheme,
  emailStyle,
  onEmailStyleChange,
  onSubjectChange,
  onThemeChange,
  selectedTheme,
  subject,
}: GeneralSettingsPanelProps) {
  const themeOptions: ConditionSelectOption[] = [
    ...(currentFormTheme.isCustom
      ? [
          {
            icon: <ThemeSelectIcon theme={currentFormTheme.config} />,
            label: "Current form theme",
            subtitle: `${currentFormTheme.config.label} custom settings`,
            value: currentFormTheme.value,
          },
        ]
      : []),
    ...THEMES.map((theme) => ({
      icon: <ThemeSelectIcon theme={theme} />,
      label: theme.label,
      value: theme.key,
    })),
  ];

  return (
    <div className="border-b border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-400">General settings</p>

      <div className="mt-6">
        <p className="mb-2 text-sm font-bold text-gray-500">Style</p>
        <div className="grid grid-cols-2 overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
          {EMAIL_STYLE_OPTIONS.map(({ Icon, label, value }) => {
            const isSelected = emailStyle === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onEmailStyleChange(value)}
                className={`flex h-20 flex-col items-center justify-center gap-2 border-r border-gray-200 text-sm font-semibold transition-colors last:border-r-0 ${
                  isSelected
                    ? "bg-white text-gray-700 ring-1 ring-inset ring-gray-900"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-1 block text-sm font-bold text-gray-500">
          Email subject
        </label>
        <p className="mb-2 text-xs leading-relaxed text-gray-400">
          The title recipients see in their inbox.
        </p>
        <input
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          placeholder="Fill out: My form"
          className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-bold text-gray-500">Theme</p>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2">
            <ThemeSelectIcon theme={selectedTheme.config} />
          </span>
          <ConditionSelect
            value={getThemeSelectValue(selectedTheme)}
            placeholder="Select theme"
            options={themeOptions}
            onChange={onThemeChange}
            menuPlacement="auto"
            menuWidth={260}
            triggerClassName="rounded-md pl-16"
          />
        </div>
      </div>
    </div>
  );
}
