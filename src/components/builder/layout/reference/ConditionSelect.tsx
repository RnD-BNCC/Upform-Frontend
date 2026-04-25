import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { ChevronDownIcon } from "@/components/icons";

const CONDITION_SELECT_OPEN_EVENT = "condition-select:open";
const CONDITION_SELECT_CLOSE_ALL_EVENT = "condition-select:close-all";

export function closeConditionSelectMenus() {
  window.dispatchEvent(new Event(CONDITION_SELECT_CLOSE_ALL_EVENT));
}

export type ConditionSelectOption = {
  value: string;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  searchText?: string;
};

type Props = {
  value?: string;
  placeholder: string;
  options: ConditionSelectOption[];
  onChange: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
  menuWidth?: number;
  menuPlacement?: "bottom" | "top" | "auto";
  selectedVariant?: "plain" | "pill";
  placeholderTextClassName?: string;
  selectedTextClassName?: string;
  triggerClassName?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

export default function ConditionSelect({
  value,
  placeholder,
  options,
  onChange,
  searchable = false,
  searchPlaceholder = "Search...",
  emptyLabel = "No options found",
  menuWidth,
  menuPlacement = "bottom",
  selectedVariant = "plain",
  placeholderTextClassName = "text-[13px] font-normal text-gray-400",
  selectedTextClassName = "text-[13px] font-medium text-gray-700",
  triggerClassName = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
    width: 0,
  });
  const instanceIdRef = useRef(
    `condition-select-${Math.random().toString(36).slice(2, 11)}`,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      `${option.label} ${option.subtitle ?? ""} ${option.searchText ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [options, search]);

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const nextWidth = Math.max(menuWidth ?? rect.width, rect.width);
    const estimatedMenuHeight = Math.min(
      320,
      (searchable ? 64 : 0) + Math.max(filteredOptions.length, 1) * 44 + 12,
    );
    const nextLeft = Math.max(
      12,
      Math.min(rect.left, window.innerWidth - nextWidth - 12),
    );

    const availableBelow = window.innerHeight - rect.bottom - 12;
    const availableAbove = rect.top - 12;
    const effectivePlacement =
      menuPlacement === "auto"
        ? availableBelow < estimatedMenuHeight && availableAbove > availableBelow
          ? "top"
          : "bottom"
        : menuPlacement;
    const preferredTop =
      effectivePlacement === "top"
        ? rect.top - estimatedMenuHeight - 6
        : rect.bottom + 6;

    setPosition({
      top: Math.max(
        12,
        Math.min(preferredTop, window.innerHeight - estimatedMenuHeight - 12),
      ),
      left: nextLeft,
      width: nextWidth,
    });
  }, [filteredOptions.length, menuPlacement, menuWidth, searchable]);

  useEffect(() => {
    const handleOpenEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string }>;
      if (customEvent.detail?.id === instanceIdRef.current) return;
      setOpen(false);
      setSearch("");
    };

    const handleCloseAll = () => {
      setOpen(false);
      setSearch("");
    };

    window.addEventListener(
      CONDITION_SELECT_OPEN_EVENT,
      handleOpenEvent as EventListener,
    );
    window.addEventListener(CONDITION_SELECT_CLOSE_ALL_EVENT, handleCloseAll);

    return () => {
      window.removeEventListener(
        CONDITION_SELECT_OPEN_EVENT,
        handleOpenEvent as EventListener,
      );
      window.removeEventListener(
        CONDITION_SELECT_CLOSE_ALL_EVENT,
        handleCloseAll,
      );
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
  }, [filteredOptions.length, open, search, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleViewportChange = () => updatePosition();

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [open, updatePosition]);

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      return;
    }

    window.dispatchEvent(
      new CustomEvent(CONDITION_SELECT_OPEN_EVENT, {
        detail: { id: instanceIdRef.current },
      }),
    );
    setSearch("");
    updatePosition();
    setOpen(true);
  };

  const renderSelectedValue = () => {
    if (!selectedOption) {
      return (
        <span className={`truncate ${placeholderTextClassName}`}>
          {placeholder}
        </span>
      );
    }

    if (selectedVariant === "pill") {
      return (
        <span className="inline-flex max-w-full items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[12px] font-medium text-gray-600">
          <span className="truncate">{selectedOption.label}</span>
        </span>
      );
    }

    return (
      <span className={`truncate ${selectedTextClassName}`}>
        {selectedOption.label}
      </span>
    );
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        data-condition-select-trigger="true"
        className={`group flex h-10 w-full items-center justify-between gap-2 overflow-hidden border border-gray-300 bg-white pl-2 pr-[10px] text-left transition duration-100 hover:border-gray-400 hover:bg-gray-50 focus:!ring focus:!ring-offset-0 focus:ring-gray-300 ${triggerClassName}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          {renderSelectedValue()}
        </span>
        <span className="flex shrink-0 items-center gap-2 pl-2">
          <span className="h-5 border-l border-gray-200" />
          <ChevronDownIcon
            size={16}
            className={`text-gray-400 transition-transform group-hover:text-gray-600 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            data-condition-select-root="true"
            data-condition-select-menu="true"
            className="fixed z-[10001] overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
          >
            {searchable && (
              <div className="border-b border-gray-100 p-2.5">
                <div className="flex items-center gap-2 rounded-md border border-gray-200 px-2.5 py-2 focus-within:border-gray-400">
                  <MagnifyingGlassIcon
                    size={13}
                    className="shrink-0 text-gray-400"
                  />
                  <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-transparent text-[13px] text-gray-700 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto py-1.5">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={`mx-1.5 flex w-[calc(100%-0.75rem)] items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-gray-100 text-gray-800"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {option.icon ? (
                        <span className="shrink-0">{option.icon}</span>
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">
                          {option.label}
                        </span>
                        {option.subtitle ? (
                          <span className="mt-0.5 block truncate text-[11px] text-gray-400">
                            {option.subtitle}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-3 text-[13px] text-gray-400">
                  {emptyLabel}
                </p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
