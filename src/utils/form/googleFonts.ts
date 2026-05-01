import {
  buildThemeFontFamily,
  type ThemeFontCategory,
  type ThemeFontOption,
} from "./themeConfig";

export type GoogleFontOption = ThemeFontOption;

type GoogleFontsApiResponse = {
  items?: Array<{
    category?: ThemeFontCategory;
    family?: string;
  }>;
};

type GoogleFontsCachePayload = {
  fonts?: unknown;
  savedAt?: string;
};

type GoogleFontsFamilyEntry = {
  category?: ThemeFontCategory;
  family?: string;
};

const GOOGLE_FONTS_API_BASE_URL =
  "https://www.googleapis.com/webfonts/v1/webfonts?sort=alpha";
const GOOGLE_FONTS_CSS_BASE_URL = "https://fonts.googleapis.com/css2";
const GOOGLE_FONTS_CACHE_KEY = "upform-google-fonts-cache-v1";
const GOOGLE_FONTS_SNAPSHOT_URL =
  "https://cdn.jsdelivr.net/npm/google-fonts-complete@2.2.3/api-response.json";

let cachedGoogleFonts: GoogleFontOption[] | null = null;
let googleFontsPromise: Promise<GoogleFontOption[]> | null = null;
const loadedFontRequests = new Set<string>();

function dedupeFonts(fonts: GoogleFontOption[]) {
  const seen = new Map<string, GoogleFontOption>();

  fonts.forEach((font) => {
    if (!seen.has(font.key)) {
      seen.set(font.key, font);
    }
  });

  return Array.from(seen.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

function normalizeGoogleFont(
  family: string,
  category: ThemeFontCategory = "sans-serif",
): GoogleFontOption {
  const normalizedCategory =
    typeof category === "string"
      ? category.trim().toLowerCase().replace(/\s+/g, "-")
      : "sans-serif";

  return {
    key: family,
    label: family,
    family: buildThemeFontFamily(family, normalizedCategory),
    category: normalizedCategory,
  };
}

function buildGoogleFontsCssUrl(fonts: GoogleFontOption[]) {
  const familiesQuery = fonts
    .map((font) => `family=${encodeURIComponent(font.key).replace(/%20/g, "+")}`)
    .join("&");

  return `${GOOGLE_FONTS_CSS_BASE_URL}?${familiesQuery}&display=swap`;
}

function chunkFonts(fonts: GoogleFontOption[], size: number) {
  const chunks: GoogleFontOption[][] = [];

  for (let index = 0; index < fonts.length; index += size) {
    chunks.push(fonts.slice(index, index + size));
  }

  return chunks;
}

function isGoogleFontOption(value: unknown): value is GoogleFontOption {
  if (!value || typeof value !== "object") {
    return false;
  }

  const font = value as Partial<GoogleFontOption>;
  return (
    typeof font.key === "string" &&
    typeof font.label === "string" &&
    typeof font.family === "string" &&
    typeof font.category === "string"
  );
}

function isGoogleFontsFamilyEntry(value: unknown): value is GoogleFontsFamilyEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<GoogleFontsFamilyEntry>;
  return typeof entry.family === "string";
}

function extractGoogleFontsFamilyEntries(value: unknown): GoogleFontsFamilyEntry[] {
  if (Array.isArray(value)) {
    const entries = value.filter(isGoogleFontsFamilyEntry);
    return entries.length > 0 ? entries : [];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const objectValue = value as Record<string, unknown>;
  const directArrayKeys = [
    "familyMetadataList",
    "families",
    "fontFamilies",
    "items",
  ];

  for (const key of directArrayKeys) {
    const entries = extractGoogleFontsFamilyEntries(objectValue[key]);
    if (entries.length > 0) {
      return entries;
    }
  }

  for (const child of Object.values(objectValue)) {
    if (!Array.isArray(child)) {
      continue;
    }

    const entries = extractGoogleFontsFamilyEntries(child);
    if (entries.length > 0) {
      return entries;
    }
  }

  for (const child of Object.values(objectValue)) {
    if (!child || typeof child !== "object" || Array.isArray(child)) {
      continue;
    }

    const entries = extractGoogleFontsFamilyEntries(child);
    if (entries.length > 0) {
      return entries;
    }
  }

  return [];
}

async function fetchGoogleFontsEntriesFromJsonUrl(url: string) {
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    throw new Error(`Failed to load Google Fonts list: ${response.status}`);
  }

  const parsed = (await response.json()) as GoogleFontsApiResponse;
  return extractGoogleFontsFamilyEntries(parsed);
}

async function fetchGoogleFontsEntries() {
  const googleFontsApiKey = import.meta.env.VITE_GOOGLE_FONTS_API_KEY;

  if (googleFontsApiKey) {
    try {
      return await fetchGoogleFontsEntriesFromJsonUrl(
        `${GOOGLE_FONTS_API_BASE_URL}&key=${encodeURIComponent(googleFontsApiKey)}`,
      );
    } catch (error) {
      console.error("[fetchGoogleFontsEntries:officialApi]", error);
    }
  }

  return fetchGoogleFontsEntriesFromJsonUrl(GOOGLE_FONTS_SNAPSHOT_URL);
}

function readStoredGoogleFonts() {
  if (typeof window === "undefined") {
    return [] as GoogleFontOption[];
  }

  try {
    const rawValue = window.localStorage.getItem(GOOGLE_FONTS_CACHE_KEY);
    if (!rawValue) {
      return [] as GoogleFontOption[];
    }

    const parsed = JSON.parse(rawValue) as GoogleFontsCachePayload;
    if (!Array.isArray(parsed.fonts)) {
      return [] as GoogleFontOption[];
    }

    return dedupeFonts(parsed.fonts.filter(isGoogleFontOption));
  } catch {
    return [] as GoogleFontOption[];
  }
}

function writeStoredGoogleFonts(fonts: GoogleFontOption[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      GOOGLE_FONTS_CACHE_KEY,
      JSON.stringify({
        fonts,
        savedAt: new Date().toISOString(),
      } satisfies GoogleFontsCachePayload),
    );
  } catch {
    // Ignore storage failures and keep using the in-memory cache.
  }
}

export function getInitialGoogleFontsList() {
  return readStoredGoogleFonts();
}

export async function fetchGoogleFontsList() {
  if (cachedGoogleFonts) {
    return cachedGoogleFonts;
  }

  if (googleFontsPromise) {
    return googleFontsPromise;
  }

  googleFontsPromise = (async () => {
    const storedFonts = readStoredGoogleFonts();

    try {
      const fonts = (await fetchGoogleFontsEntries())
        .map((entry) => {
          if (!entry.family) {
            return null;
          }

          return normalizeGoogleFont(entry.family, entry.category ?? "sans-serif");
        })
        .filter((entry): entry is GoogleFontOption => Boolean(entry));

      if (fonts.length === 0) {
        throw new Error("Google Fonts metadata returned an empty list.");
      }

      cachedGoogleFonts = dedupeFonts(fonts);
      writeStoredGoogleFonts(cachedGoogleFonts);
      return cachedGoogleFonts;
    } catch (error) {
      console.error("[fetchGoogleFontsList]", error);
      if (storedFonts.length > 0) {
        cachedGoogleFonts = storedFonts;
        return cachedGoogleFonts;
      }

      return [] as GoogleFontOption[];
    } finally {
      googleFontsPromise = null;
    }
  })();

  return googleFontsPromise;
}

export function ensureGoogleFontsLoaded(fonts: GoogleFontOption[]) {
  if (typeof document === "undefined") {
    return;
  }

  const uniqueFonts = dedupeFonts(fonts).filter(
    (font) => font.key !== "System" && font.key !== "Serif" && font.key !== "Mono",
  );

  chunkFonts(uniqueFonts, 8).forEach((fontChunk) => {
    if (fontChunk.length === 0) {
      return;
    }

    const href = buildGoogleFontsCssUrl(fontChunk);
    if (loadedFontRequests.has(href)) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    loadedFontRequests.add(href);
  });
}
