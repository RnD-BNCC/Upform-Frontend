import type { ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react";
import { SuccessIcon, FailedIcon } from "@/components/icons";

export type StatusType = "success" | "error";

type StatusModalProps = {
  isOpen: boolean;
  onClose: () => void;
  type: StatusType;
  title: string;
  description: string | ReactNode;
  buttonText?: string;
  onButtonClick?: () => void;
};

const typeConfig = {
  success: {
    icon: <SuccessIcon size={48} />,
    pingColor: "bg-emerald-500",
    buttonClass: "bg-primary-500 text-white",
  },
  error: {
    icon: <FailedIcon size={48} />,
    pingColor: "bg-red-400",
    buttonClass: "border border-red-500 text-red-500",
  },
};

export default function StatusModal({
  isOpen,
  onClose,
  type,
  title,
  description,
  buttonText = "Close",
  onButtonClick,
}: StatusModalProps) {
  if (!isOpen) return null;

  const config = typeConfig[type];

  return (
    <div
      className="fixed inset-0 z-[100002] flex items-center justify-center bg-black/50 text-black"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[18rem] rounded-md bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end p-4">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
          >
            <XIcon size={18} weight="bold" className="text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 px-6 pt-3 pb-6 text-center">
          <div className="relative flex size-12">
            <span
              className={`absolute h-full w-full animate-ping rounded-full opacity-50 ${config.pingColor}`}
            />
            <div className="relative">{config.icon}</div>
          </div>
          <div>
            <h1 className="text-xl leading-loose font-bold">{title}</h1>
            <h2 className="text-base leading-[1.15] text-center">
              {description}
            </h2>
            <div
              onClick={onButtonClick ?? onClose}
              className={`${config.buttonClass} mt-8 flex cursor-pointer select-none items-center justify-center rounded-[4px] py-2 font-semibold`}
            >
              {buttonText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
