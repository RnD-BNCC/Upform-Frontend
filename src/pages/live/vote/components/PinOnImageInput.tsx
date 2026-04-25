import { useState } from "react";
import type { MouseEvent } from "react";
import { MapPin, SpinnerGap } from "@phosphor-icons/react";

type Props = {
  imageUrl?: string;
  onSubmit: (value: unknown) => void;
  isPending: boolean;
};

export default function PinOnImageInput({
  imageUrl,
  onSubmit,
  isPending,
}: Props) {
  const [pinned, setPinned] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setPinned({ x, y });
  };

  if (!imageUrl) {
    return (
      <div className="text-center text-sm text-gray-400 py-8 rounded-xl border-2 border-dashed border-gray-200">
        No image set for this slide yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500 text-center font-medium">
        Tap on the image to place your pin
      </p>
      <div
        className="relative rounded-xl overflow-hidden cursor-crosshair border-2 border-gray-200 active:border-primary-400 transition-colors"
        onClick={handleClick}
      >
        <img src={imageUrl} alt="" className="w-full" draggable={false} />
        {pinned && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${pinned.x}%`,
              top: `${pinned.y}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <MapPin
              size={28}
              weight="fill"
              className="text-red-500 drop-shadow-md"
            />
          </div>
        )}
      </div>
      <button
        onClick={() => pinned && onSubmit({ x: pinned.x, y: pinned.y })}
        disabled={!pinned || isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <SpinnerGap size={16} className="animate-spin" /> Submitting...
          </span>
        ) : (
          "Pin it!"
        )}
      </button>
    </div>
  );
}
