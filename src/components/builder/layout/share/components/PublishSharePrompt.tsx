import { RocketLaunchIcon } from "@phosphor-icons/react";
import { Spinner } from "@/components/ui";
import type { EventStatus } from "@/types/builderShare";

type PublishSharePromptProps = {
  eventStatus: EventStatus;
  isDirty?: boolean;
  isPublishing?: boolean;
  onPublish: () => void;
};

export default function PublishSharePrompt({
  eventStatus,
  isDirty,
  isPublishing,
  onPublish,
}: PublishSharePromptProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto bg-white px-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-950">
          Publish your form to share it with others
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          You can keep changing it after publishing.
        </p>
      </div>

      {isDirty ? (
        <p className="text-xs font-semibold text-amber-500">
          Unsaved changes will be included before publishing.
        </p>
      ) : null}

      <button
        type="button"
        onClick={onPublish}
        disabled={isPublishing}
        className="flex h-12 items-center justify-center gap-2 rounded-sm bg-primary-600 px-8 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPublishing ? (
          <Spinner size={17} />
        ) : (
          <RocketLaunchIcon size={17} weight="fill" />
        )}
        {isPublishing
          ? "Publishing..."
          : eventStatus === "closed"
            ? "Reopen form"
            : "Publish"}
      </button>
    </div>
  );
}
