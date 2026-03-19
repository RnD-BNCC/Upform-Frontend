import { SpinnerGapIcon } from "@phosphor-icons/react";

type LoadingModalProps = {
  isOpen: boolean;
  title?: string;
  description?: string;
};

export default function LoadingModal({
  isOpen,
  title = "Processing...",
  description = "Please wait a moment while we process your request.",
}: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="text-black fixed inset-0 bg-black/50 flex justify-center items-center z-[9999]">
      <div
        className="bg-white rounded-md shadow-xl w-full max-w-[18.75rem] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end items-center p-4" />
        <span className="m-4" />
        <div className="flex flex-col justify-center items-center py-4 px-9 text-center gap-6">
          <div className="relative flex size-12">
            <SpinnerGapIcon
              size={55}
              className="text-primary-500 animate-spin"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-loose">{title}</h1>
            <h2 className="text-base leading-[1.15] text-center">
              {description}
            </h2>
          </div>
        </div>

        <div className="p-4" />
      </div>
    </div>
  );
}
