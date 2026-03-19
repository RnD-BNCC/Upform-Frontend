import type { ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react";
import { SuccessIcon, FailedIcon } from "./icons";

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
      className="text-black fixed inset-0 bg-black/50 flex justify-center items-center z-[100002]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-md shadow-xl w-full max-w-[18rem] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end items-center p-4">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <XIcon size={18} weight="bold" className="text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col justify-center items-center pt-3 pb-6 px-6 text-center gap-6">
          <div className="relative flex size-12">
            <span
              className={`absolute animate-ping ${config.pingColor} rounded-full h-full w-full opacity-50`}
            />
            <div className="relative">{config.icon}</div>
          </div>
          <div>
            <h1 className="text-xl font-bold leading-loose">{title}</h1>
            <h2 className="text-base leading-[1.15] text-center">
              {description}
            </h2>
            <div
              onClick={onButtonClick ?? onClose}
              className={`${config.buttonClass} flex justify-center items-center font-semibold rounded-[4px] py-2 mt-8 cursor-pointer select-none`}
            >
              {buttonText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
