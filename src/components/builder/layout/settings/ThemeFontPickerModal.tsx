import { useEffect, useMemo, useState } from "react";
import {
  MagnifyingGlassIcon,
  SpinnerGapIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  ensureGoogleFontsLoaded,
  fetchGoogleFontsList,
  getInitialGoogleFontsList,
  type GoogleFontOption,
} from "@/utils/form/googleFonts";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (font: GoogleFontOption) => void;
  selectedFontKey?: string;
};

const PREVIEW_TEXT = "The quick brown fox jumped over the lazy dog";

export default function ThemeFontPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedFontKey,
}: Props) {
  const [fonts, setFonts] = useState<GoogleFontOption[]>(() =>
    getInitialGoogleFontsList(),
  );
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(60);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    setHasLoadError(false);
    setIsLoading(fonts.length === 0);
    void fetchGoogleFontsList()
      .then((nextFonts) => {
        if (isMounted) {
          setFonts(nextFonts);
          setHasLoadError(nextFonts.length === 0);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setVisibleCount(60);
  }, [fonts.length, isOpen, query]);

  const filteredFonts = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      return fonts;
    }

    return fonts.filter((font) =>
      font.label.toLowerCase().includes(trimmedQuery),
    );
  }, [fonts, query]);

  const visibleFonts = useMemo(
    () => filteredFonts.slice(0, visibleCount),
    [filteredFonts, visibleCount],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    ensureGoogleFontsLoaded(visibleFonts);
  }, [isOpen, visibleFonts]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/35 px-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-sm bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-8 py-5">
          <div className="flex items-center gap-8">
            <div className="border-b-2 border-gray-900 pb-2 text-2xl font-medium text-gray-900">
              Google fonts
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-6 px-8 py-4">
          <h2 className="text-sm font-medium text-gray-600">
            Choose a font
          </h2>

          <label className="flex h-9 w-full max-w-sm items-center gap-2 rounded-sm border border-gray-200 bg-white px-2.5">
            <MagnifyingGlassIcon size={16} className="text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search fonts"
              className="w-full bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
            />
          </label>
        </div>

        <div
          className="flex-1 overflow-y-auto px-8 pb-6"
          onScroll={(event) => {
            const element = event.currentTarget;
            const isNearBottom =
              element.scrollTop + element.clientHeight >=
              element.scrollHeight - 180;

            if (!isNearBottom) {
              return;
            }

            setVisibleCount((currentCount) =>
              Math.min(currentCount + 60, filteredFonts.length),
            );
          }}
        >
          {isLoading ? (
            <div className="flex h-56 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <SpinnerGapIcon size={18} className="animate-spin" />
                Loading Google fonts...
              </div>
            </div>
          ) : hasLoadError ? (
            <div className="flex h-56 items-center justify-center text-sm text-gray-400">
              Google Fonts couldn&apos;t be loaded right now.
            </div>
          ) : filteredFonts.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-gray-400">
              No fonts found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-2 xl:grid-cols-3">
              {visibleFonts.map((font) => {
                const isSelected = selectedFontKey === font.key;

                return (
                  <button
                    key={font.key}
                    type="button"
                    onClick={() => onSelect(font)}
                    className={`overflow-hidden rounded-sm border text-left transition-all ${
                      isSelected
                        ? "border-primary-500 ring-2 ring-primary-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="min-h-[146px] px-5 py-4 text-[21px] leading-tight text-gray-800"
                      style={{ fontFamily: font.family }}
                    >
                      {PREVIEW_TEXT}
                    </div>
                    <div className="border-t border-gray-100 px-5 py-3 text-xs font-medium text-gray-700">
                      {font.label}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!isLoading &&
          !hasLoadError &&
          visibleFonts.length > 0 &&
          visibleFonts.length < filteredFonts.length ? (
            <div className="py-4 text-center text-xs text-gray-400">
              Scroll to load more fonts ({visibleFonts.length} of{" "}
              {filteredFonts.length})
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end border-t border-gray-100 px-8 py-5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-sm bg-gray-900 px-6 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
