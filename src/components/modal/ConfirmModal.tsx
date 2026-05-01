import type { ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react";
import { TrashIcon, WarningIcon, CheckRingIcon } from "@/components/icons";
import { BaseModal } from "@/components/ui";

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
  const config = variantConfig[variant];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} zIndex="z-[9999]" className="w-full max-w-[18rem]">
      <div className="flex items-center justify-end p-4">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
        >
          <XIcon size={18} weight="bold" className="text-gray-500" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center gap-6 px-6 pt-3 pb-6 text-center text-black">
        <div className="relative flex size-12">{config.icon}</div>
        <div>
          <h1 className="text-lg leading-loose font-bold">{title}</h1>
          <h2 className="text-base leading-[1.15] text-center">{description}</h2>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className={`${config.confirmClass} rounded-sm py-2 text-sm font-bold hover:opacity-90`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className={`${config.cancelClass} rounded-sm py-2 text-sm font-bold hover:bg-opacity-10`}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
