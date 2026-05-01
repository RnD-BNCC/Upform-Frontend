import { getAllGamePlugins } from "./gameRegistry";
import type { GamePanelProps } from "@/types/builderGame";

export default function BuilderGamePanel(props: GamePanelProps) {
  const gamePlugins = getAllGamePlugins();
  const availableLabel = `${gamePlugins.length} game${
    gamePlugins.length === 1 ? "" : "s"
  } available`;

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-7xl px-8 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-950">Game</h1>
            <p className="mt-2 text-sm text-gray-500">
              Games for responses from{" "}
              <span className="font-semibold text-gray-800">{props.formTitle}</span>.
            </p>
          </div>
          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-500">
            {availableLabel}
          </span>
        </div>

        <div className="mt-8 space-y-4">
          {gamePlugins.map((plugin) => (
            <div key={plugin.type}>{plugin.renderCard(props)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
