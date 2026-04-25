export const THEME_LOGO_ICON_PREFIX = "phosphor:";

export function createThemeLogoIconValue(iconName: string) {
  return `${THEME_LOGO_ICON_PREFIX}${iconName}`;
}

export function getThemeLogoIconName(value?: string | null) {
  if (!value?.startsWith(THEME_LOGO_ICON_PREFIX)) {
    return null;
  }

  return value.slice(THEME_LOGO_ICON_PREFIX.length) || null;
}
