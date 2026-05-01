import type { ReactNode } from "react";

type PresenterToolbarButtonProps = {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  variant?: "danger";
};

export default function PresenterToolbarButton({
  active,
  children,
  disabled,
  onClick,
  title,
  variant,
}: PresenterToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        variant === "danger"
          ? "text-gray-500 hover:bg-red-50 hover:text-red-500"
          : active
            ? "bg-gray-200 text-gray-800"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
