import { DesktopIcon } from "@phosphor-icons/react";

type PollEditorLargeScreenNoticeProps = {
  onBack: () => void;
};

export default function PollEditorLargeScreenNotice({
  onBack,
}: PollEditorLargeScreenNoticeProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-3 py-6 lg:hidden">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-4 py-5 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <DesktopIcon size={24} weight="duotone" />
        </div>
        <h1 className="text-base font-bold text-gray-950">
          The UpForm poll editor works best on larger screens
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          Polls you create will still work for participants on mobile devices.
        </p>

        <div className="mt-5">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-full items-center justify-center rounded-sm bg-gray-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Back to polls
          </button>
        </div>
      </div>
    </div>
  );
}

