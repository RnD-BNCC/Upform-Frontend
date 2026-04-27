import type { GamePlugin } from "@/types/builderGame";

const GAME_PLUGIN_MODULES = import.meta.glob("./plugins/*/index.tsx", {
  eager: true,
}) as Record<string, Record<string, unknown>>;

function isGamePluginExport(value: unknown): value is GamePlugin {
  if (typeof value !== "object" || value == null) {
    return false;
  }

  const plugin = value as Partial<GamePlugin>;

  return (
    typeof plugin.type === "string" &&
    typeof plugin.meta === "object" &&
    plugin.meta != null &&
    typeof plugin.meta.label === "string" &&
    typeof plugin.meta.description === "string" &&
    typeof plugin.renderCard === "function"
  );
}

const DISCOVERED_GAME_PLUGINS = Object.values(GAME_PLUGIN_MODULES).flatMap(
  (moduleExports) => Object.values(moduleExports).filter(isGamePluginExport),
);

const GAME_PLUGIN_MAP = DISCOVERED_GAME_PLUGINS.reduce<Record<string, GamePlugin>>(
  (registry, plugin) => {
    registry[plugin.type] = plugin;
    return registry;
  },
  {},
);

export function getAllGamePlugins() {
  return Object.values(GAME_PLUGIN_MAP).sort((left, right) =>
    left.meta.label.localeCompare(right.meta.label),
  );
}

export function getGamePlugin(type: string) {
  return GAME_PLUGIN_MAP[type] ?? null;
}
