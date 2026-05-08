export const BRAND_NAME = "UpForm";

export type BrandLogoVariant = "blue" | "white";

export const BRAND_LOGOS: Record<BrandLogoVariant, string> = {
  blue: "/logo_blue.png",
  white: "/logo_white.png",
};

function normalizeHexColor(color: string) {
  const trimmed = color.trim();

  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed
      .slice(1)
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`;
  }

  return trimmed;
}

export function getBrandLogoVariantForBackground(
  color?: string,
): BrandLogoVariant {
  if (!color) return "blue";

  const hex = normalizeHexColor(color);
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return "blue";

  const luminance = getHexLuminance(hex);

  return luminance < 150 ? "white" : "blue";
}

export function getBrandLogoVariantForTextColor(
  color?: string,
): BrandLogoVariant {
  if (!color) return "blue";

  const hex = normalizeHexColor(color);
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return "blue";

  const luminance = getHexLuminance(hex);

  return luminance > 170 ? "white" : "blue";
}

function getHexLuminance(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000;
}

export function getBrandLogoSrc(
  variant: BrandLogoVariant = "blue",
  absolute = false,
) {
  const src = BRAND_LOGOS[variant];

  if (!absolute) return src;

  const appUrl = import.meta.env.VITE_APP_URL as string | undefined;
  if (appUrl) return `${appUrl}${src}`;

  if (typeof window === "undefined" || !window.location?.origin) return src;

  return `${window.location.origin}${src}`;
}
