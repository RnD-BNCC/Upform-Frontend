import type { ThemeConfig } from "@/utils/form/themeConfig";
import * as PhosphorIcons from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { getThemeLogoIconName } from "@/utils/form/themeLogo";

type Props = {
  className?: string;
  insideSurface: boolean;
  themeConfig: Pick<ThemeConfig, "logoEnabled" | "logoUrl">;
};

export default function ThemeLogo({
  className = "",
  insideSurface,
  themeConfig,
}: Props) {
  if (!themeConfig.logoEnabled || !themeConfig.logoUrl) {
    return null;
  }

  if (insideSurface) {
    return null;
  }

  const iconName = getThemeLogoIconName(themeConfig.logoUrl);
  const Icon =
    iconName && iconName in PhosphorIcons
      ? (PhosphorIcons[iconName as keyof typeof PhosphorIcons] as Icon)
      : null;

  return (
    <div className={`flex justify-end ${className}`.trim()}>
      {Icon ? (
        <Icon size={48} className="text-gray-600" />
      ) : (
        <img
          src={themeConfig.logoUrl}
          alt="Form logo"
          className="h-12 max-w-[180px] object-contain"
        />
      )}
    </div>
  );
}
