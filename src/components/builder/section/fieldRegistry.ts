import type {
  CreateFieldOptions,
  FieldPaletteGroup,
  FieldPaletteItem,
  FieldPlugin,
  FieldPluginSettings,
  SectionPageType,
} from "@/types/builder";
import type { FieldType, FormField } from "@/types/form";
const BUILDER_CATEGORY_ORDER: readonly string[] = [
  "Frequently used",
  "Display text",
  "Choices",
  "Rating & Ranking",
  "Text",
  "Contact Info",
  "Number",
  "Time",
  "File & Media",
];

const ENDING_CATEGORY_ORDER: readonly string[] = ["Content", "Navigation"];

const SECTION_PLUGIN_MODULES = import.meta.glob("./*Field.tsx", {
  eager: true,
}) as Record<string, Record<string, unknown>>;

function isFieldPluginExport(value: unknown): value is FieldPlugin {
  if (typeof value !== "object" || value == null) {
    return false;
  }

  const plugin = value as Partial<FieldPlugin>;
  const icon = plugin.meta?.Icon;

  return (
    typeof plugin.type === "string" &&
    typeof plugin.meta === "object" &&
    plugin.meta != null &&
    typeof plugin.meta.label === "string" &&
    typeof plugin.meta.iconBg === "string" &&
    icon != null &&
    (typeof icon === "function" || typeof icon === "object")
  );
}

const DISCOVERED_SECTION_PLUGINS = Object.values(SECTION_PLUGIN_MODULES).flatMap(
  (moduleExports) => Object.values(moduleExports).filter(isFieldPluginExport),
);
const FIELD_PLUGIN_MAP = DISCOVERED_SECTION_PLUGINS.reduce<
  Partial<Record<FieldType, FieldPlugin>>
>((registry, plugin) => {
  registry[plugin.type] = plugin;
  return registry;
}, {});

function getCategoryRank(label: string, placement: "builder" | "ending") {
  const order: readonly string[] =
    placement === "builder" ? BUILDER_CATEGORY_ORDER : ENDING_CATEGORY_ORDER;
  const index = order.indexOf(label);
  return index >= 0 ? index : order.length;
}

export function getAllFieldPlugins() {
  return Object.values(FIELD_PLUGIN_MAP).filter(
    (plugin): plugin is FieldPlugin => Boolean(plugin),
  );
}

export function getFieldPlugin(type: FieldType) {
  return FIELD_PLUGIN_MAP[type] ?? null;
}

export function getFieldPluginSettings(type: FieldType): FieldPluginSettings {
  return getFieldPlugin(type)?.settings ?? {};
}

export function fieldSupportsSetting(
  type: FieldType,
  setting: keyof FieldPluginSettings,
) {
  const settings = getFieldPluginSettings(type);

  if (setting === "halfWidth") {
    return settings.halfWidth ?? true;
  }

  if (setting === "logic") {
    return settings.logic ?? !settings.displayOnly;
  }

  return settings[setting] ?? false;
}

export function createDefaultField(
  type: FieldType,
  options?: CreateFieldOptions,
): FormField {
  const plugin = getFieldPlugin(type);

  if (plugin?.createField) {
    return plugin.createField(options);
  }

  return {
    id: options?.id ?? crypto.randomUUID(),
    label: plugin?.meta.label ?? "Question",
    required: false,
    type,
    ...options?.overrides,
  };
}

export function createPageTypeDefaultFields(
  pageType: SectionPageType,
  options?: { sectionId?: string },
) {
  if (pageType === "ending") {
    return [createDefaultField("thank_you_block")];
  }

  if (pageType === "page") {
    return [
      createDefaultField("next_button", {
        id: options?.sectionId ? `__next_${options.sectionId}` : undefined,
      }),
    ];
  }

  return [];
}

export function getFieldPaletteGroups(
  placement: "builder" | "ending",
): FieldPaletteGroup[] {
  const grouped = new Map<string, Array<FieldPaletteItem & { order: number }>>();

  for (const plugin of getAllFieldPlugins()) {
    for (const entry of plugin.palettes ?? []) {
      if (entry.placement !== placement) continue;

      const items = grouped.get(entry.category) ?? [];
      items.push({
        Icon: plugin.meta.Icon,
        action: entry.action ?? "add",
        iconBg: plugin.meta.iconBg,
        label: entry.label ?? plugin.meta.label,
        order: entry.order ?? 999,
        type: plugin.type,
      });
      grouped.set(entry.category, items);
    }
  }

  return [...grouped.entries()]
    .sort(
      ([left], [right]) =>
        getCategoryRank(left, placement) - getCategoryRank(right, placement),
    )
    .map(([label, items]) => ({
      label,
      items: items
        .sort(
          (left, right) =>
            left.order - right.order || left.label.localeCompare(right.label),
        )
        .map(({ order: _order, ...item }) => item),
    }));
}

export function getFieldTypeMetaMap() {
  return getAllFieldPlugins().reduce<
    Partial<
      Record<
        FieldType,
        {
          Icon: FieldPlugin["meta"]["Icon"];
          iconBg: string;
          label: string;
        }
      >
    >
  >((metaMap, plugin) => {
    metaMap[plugin.type] = {
      Icon: plugin.meta.Icon,
      iconBg: plugin.meta.iconBg,
      label: plugin.meta.label,
    };
    return metaMap;
  }, {});
}

export function getSimilarTypesMap() {
  return getAllFieldPlugins().reduce<Partial<Record<FieldType, FieldType[]>>>(
    (similarMap, plugin) => {
      if (plugin.meta.similarTypes?.length) {
        similarMap[plugin.type] = [...plugin.meta.similarTypes];
      }
      return similarMap;
    },
    {},
  );
}
