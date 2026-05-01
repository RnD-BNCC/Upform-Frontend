import {
  ArrowsHorizontalIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  DEFAULT_IMAGE_MAX_HEIGHT,
  DEFAULT_IMAGE_WIDTH,
} from "../constants";
import type { EmailBlockPatch, ImageBlock, SpacerBlock } from "@/types/builderShare";
import { BlockTypeIcon } from "./BlockControls";

function ModalToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? "bg-primary-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function ImageSettingsPanel({
  block,
  onClose,
  onPickImage,
  onUpdate,
}: {
  block: ImageBlock;
  onClose: () => void;
  onPickImage: () => void;
  onUpdate: (patch: EmailBlockPatch) => void;
}) {
  const alignmentOptions = [
    { value: "left" as const, Icon: TextAlignLeftIcon },
    { value: "center" as const, Icon: TextAlignCenterIcon },
    { value: "right" as const, Icon: TextAlignRightIcon },
    { value: "full" as const, Icon: ArrowsHorizontalIcon },
  ];

  return (
    <div className="min-h-full bg-white">
      <div className="flex h-14 items-center border-b border-gray-200 px-5">
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close image settings"
        >
          <XIcon size={20} />
        </button>
        <span className="ml-auto text-sm font-semibold text-gray-400">Image</span>
        <button
          type="button"
          onClick={onPickImage}
          className="ml-3"
          title="Change image"
        >
          <BlockTypeIcon type="image" />
        </button>
      </div>

      <div className="space-y-6 p-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Alignment
          </label>
          <div className="grid grid-cols-4 overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
            {alignmentOptions.map(({ value, Icon }) => {
              const isActive = (block.align ?? "center") === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onUpdate({ align: value })}
                  className={`flex h-9 items-center justify-center border-r border-gray-200 text-gray-500 transition-colors last:border-r-0 ${
                    isActive
                      ? "bg-white text-gray-900 ring-1 ring-inset ring-gray-800"
                      : "hover:bg-gray-50 hover:text-gray-800"
                  }`}
                  title={`Align ${value}`}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Max height
          </label>
          <input
            type="number"
            min={40}
            max={800}
            value={block.maxHeight ?? DEFAULT_IMAGE_MAX_HEIGHT}
            onChange={(event) =>
              onUpdate({
                maxHeight: Math.max(40, Number(event.target.value) || 40),
              })
            }
            className="h-11 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Width
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={20}
              max={100}
              value={
                (block.align ?? "center") === "full"
                  ? 100
                  : block.width ?? DEFAULT_IMAGE_WIDTH
              }
              onChange={(event) =>
                onUpdate({
                  align:
                    (block.align ?? "center") === "full"
                      ? "center"
                      : block.align,
                  width: Number(event.target.value),
                })
              }
              className="min-w-0 flex-1 accent-primary-600"
            />
            <span className="w-12 text-right text-xs font-semibold text-gray-500">
              {(block.align ?? "center") === "full"
                ? 100
                : block.width ?? DEFAULT_IMAGE_WIDTH}
              %
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-gray-600">
              Open link on click
            </span>
            <ModalToggle
              checked={Boolean(block.openLink)}
              onChange={(value) => onUpdate({ openLink: value })}
            />
          </div>

          {block.openLink ? (
            <input
              type="url"
              value={block.linkUrl ?? ""}
              onChange={(event) => onUpdate({ linkUrl: event.target.value })}
              placeholder="https://upform.com"
              className="mt-3 h-11 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function TextSettingsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="min-h-full bg-white">
      <div className="flex h-14 items-center border-b border-gray-200 px-5">
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close text settings"
        >
          <XIcon size={20} />
        </button>
        <span className="ml-auto text-sm font-semibold text-gray-400">Text</span>
        <BlockTypeIcon className="ml-3 h-8 w-8" type="text" />
      </div>

      <div className="p-5">
        <p className="text-sm font-bold text-gray-500">Styling</p>
        <p className="mt-4 max-w-52 text-sm leading-relaxed text-gray-400">
          Highlight text to{" "}
          <span className="font-bold text-gray-500">change size, alignment</span>{" "}
          and <span className="font-bold text-gray-500">color</span>
        </p>
      </div>
    </div>
  );
}

export function SpacerSettingsPanel({
  block,
  onClose,
  onUpdate,
}: {
  block: SpacerBlock;
  onClose: () => void;
  onUpdate: (patch: EmailBlockPatch) => void;
}) {
  return (
    <div className="min-h-full bg-white">
      <div className="flex h-14 items-center border-b border-gray-200 px-5">
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close spacer settings"
        >
          <XIcon size={20} />
        </button>
        <span className="ml-auto text-sm font-semibold text-gray-400">
          Spacer
        </span>
        <BlockTypeIcon className="ml-3 h-8 w-8" type="spacer" />
      </div>

      <div className="p-5">
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Height
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={4}
            max={120}
            value={block.height}
            onChange={(event) =>
              onUpdate({
                height: Number(event.target.value),
              })
            }
            className="min-w-0 flex-1 accent-primary-600"
          />
          <span className="w-12 text-right text-xs font-semibold text-gray-500">
            {block.height}px
          </span>
        </div>
      </div>
    </div>
  );
}
