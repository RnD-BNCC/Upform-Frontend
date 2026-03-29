import type { ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react";
import { TrashIcon, WarningIcon, CheckRingIcon } from "./icons";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "success";
};

const variantConfig = {
  danger: {
    icon: <TrashIcon size={48} color="#FF0000" />,
    confirmClass: "bg-red-500 text-white",
    cancelClass: "border border-red-500 text-red-500",
  },
  warning: {
    icon: <WarningIcon size={48} />,
    confirmClass: "bg-amber-500 text-white",
    cancelClass: "border border-amber-500 text-amber-500",
  },
  success: {
    icon: <CheckRingIcon size={48} color="#10b981" />,
    confirmClass: "bg-primary-500 text-white",
    cancelClass: "border border-primary-500 text-primary-500",
  },
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const config = variantConfig[variant];

  return (
    <div
      className="text-black fixed inset-0 bg-black/50 flex justify-center items-center z-[9999]"
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
          <div className="relative flex size-12">{config.icon}</div>
          <div>
            <h1 className="text-lg font-bold leading-loose">{title}</h1>
            <h2 className="text-base leading-[1.15] text-center">
              {description}
            </h2>
            <div className="flex flex-col gap-3 mt-8">
              <button
                onClick={onConfirm}
                className={`${config.confirmClass} py-2 rounded-[4px] font-bold text-sm hover:opacity-90`}
              >
                {confirmText}
              </button>
              <button
                onClick={onClose}
                className={`${config.cancelClass} py-2 rounded-[4px] font-bold text-sm hover:bg-opacity-10`}
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
