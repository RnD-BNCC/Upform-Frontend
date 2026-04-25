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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 text-black">
      <div
        className="relative w-full max-w-[18.75rem] rounded-md bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end p-4" />
        <span className="m-4" />
        <div className="flex flex-col items-center justify-center gap-6 px-9 py-4 text-center">
          <div className="relative flex size-12">
            <SpinnerGapIcon
              size={55}
              className="animate-spin text-primary-500"
            />
          </div>
          <div>
            <h1 className="text-xl leading-loose font-bold">{title}</h1>
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
