import type { EmbedType } from "@/types/builderShare";

type BrowserIllustrationProps = {
  type: EmbedType;
};

export default function BrowserIllustration({ type }: BrowserIllustrationProps) {
  return (
    <div className="relative mx-auto h-32 w-44 overflow-hidden rounded-sm border border-gray-200 bg-gray-50 shadow-sm">
      <div className="flex h-6 shrink-0 items-center gap-1 border-b border-gray-200 bg-white px-2">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span className="h-2 w-2 rounded-full bg-yellow-400" />
        <span className="h-2 w-2 rounded-full bg-green-400" />
      </div>
      <div className="absolute left-2 top-8 space-y-1.5">
        <div className="h-1.5 w-16 rounded-full bg-gray-200" />
        <div className="h-1.5 w-20 rounded-full bg-gray-200" />
        <div className="h-1.5 w-12 rounded-full bg-gray-200" />
      </div>
      {type === "standard" && (
        <div className="absolute bottom-2 left-2 right-2 top-13 rounded-sm bg-blue-100" />
      )}
      {type === "popup" && (
        <div className="absolute left-[18%] right-[18%] top-11 h-[52%] rounded-sm bg-blue-100 shadow-md" />
      )}
      {type === "fullscreen" && (
        <div className="absolute inset-x-1 bottom-1 top-7 rounded-sm bg-blue-100" />
      )}
      {type === "slider" && (
        <div className="absolute bottom-1 right-1 top-7 w-[42%] rounded-sm bg-blue-100" />
      )}
    </div>
  );
}
