import { useMemo } from "react";
import { useQueryEmailComposerDraft } from "@/api/email-blasts";
import SendFormModalEditor from "./email-composer/SendFormModalEditor";
import type { SendFormModalProps } from "@/types/builderShare";
import {
  createDefaultDraft,
  getEmailDraftFromApi,
  serializeEmailDraft,
} from "./email-composer/utils";

export default function SendFormModal(props: SendFormModalProps) {
  const draftQuery = useQueryEmailComposerDraft(props.eventId, props.isOpen);
  const fallbackDraft = useMemo(
    () => createDefaultDraft(props.formTitle, props.publicFormUrl),
    [props.formTitle, props.publicFormUrl],
  );
  const initialDraft = useMemo(
    () =>
      getEmailDraftFromApi(
        draftQuery.data,
        props.formTitle,
        props.publicFormUrl,
      ),
    [draftQuery.data, props.formTitle, props.publicFormUrl],
  );
  const savedDraftKey = useMemo(
    () => serializeEmailDraft(initialDraft),
    [initialDraft],
  );

  return (
    <SendFormModalEditor
      key={`${props.eventId}-${
        draftQuery.isFetched
          ? (draftQuery.data?.updatedAt ?? "default")
          : "pending"
      }`}
      {...props}
      initialDraft={draftQuery.isError ? fallbackDraft : initialDraft}
      savedDraftKey={
        draftQuery.isError ? serializeEmailDraft(fallbackDraft) : savedDraftKey
      }
    />
  );
}
