import { LockIcon } from "@phosphor-icons/react";

type PermissionRequiredPanelProps = {
  backLabel?: string;
  desktopOnly?: boolean;
  description: string;
  isRequesting?: boolean;
  onBack: () => void;
  onRequest: () => unknown | Promise<unknown>;
  requestDisabled?: boolean;
  title?: string;
};

export default function PermissionRequiredPanel({
  backLabel = "Back",
  desktopOnly = false,
  description,
  isRequesting = false,
  onBack,
  onRequest,
  requestDisabled = false,
  title = "Permission required",
}: PermissionRequiredPanelProps) {
  const isDisabled = isRequesting || requestDisabled;
  const shellClassName = desktopOnly
    ? "hidden min-h-screen items-center justify-center bg-gray-50 px-6 lg:flex"
    : "flex min-h-screen items-center justify-center bg-gray-50 px-6";

  return (
    <div className={shellClassName}>
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <LockIcon size={24} weight="duotone" />
        </div>
        <h1 className="text-base font-bold text-gray-950">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          {description}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 items-center justify-center rounded-md border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            {backLabel}
          </button>
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => void onRequest()}
            className="flex h-9 items-center justify-center rounded-md bg-primary-600 px-4 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRequesting
              ? "Requesting..."
              : requestDisabled
                ? "Request sent"
                : "Request permission"}
          </button>
        </div>
      </div>
    </div>
  );
}
