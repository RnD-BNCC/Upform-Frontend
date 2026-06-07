import { useCallback, useEffect, useRef, useState } from "react";
import { useMutationUpdateSlide } from "@/api/polls";
import type { PollSlide, SlideSettings, SlideType } from "@/types/polling";
import type { EditorSaveStatus } from "@/pages/polls/edit/types";
import { serializeSlideDraft } from "@/pages/polls/edit/utils";

export function useSlideState(
  slide: PollSlide,
  pollId: string,
  onSaveStatusChange?: (status: EditorSaveStatus) => void,
  onSaved?: () => void,
) {
  const updateSlide = useMutationUpdateSlide(pollId);

  const [question, setQuestionState] = useState(slide.question);
  const [type, setTypeState] = useState<SlideType>(slide.type);
  const [options, setOptionsState] = useState<string[]>(slide.options ?? []);
  const [settings, setSettingsState] = useState<SlideSettings>(
    (slide.settings as SlideSettings) ?? {},
  );

  const pendingRef = useRef({ question, type, options, settings });
  const savedSnapshotRef = useRef(serializeSlideDraft(pendingRef.current));
  const saveTimerRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);
  const queuedSaveRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuestion = slide.question;
      const nextType = slide.type;
      const nextOptions = slide.options ?? [];
      const nextSettings = (slide.settings as SlideSettings) ?? {};

      pendingRef.current = {
        question: nextQuestion,
        type: nextType,
        options: nextOptions,
        settings: nextSettings,
      };
      savedSnapshotRef.current = serializeSlideDraft(pendingRef.current);
      setQuestionState(nextQuestion);
      setTypeState(nextType);
      setOptionsState(nextOptions);
      setSettingsState(nextSettings);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [slide.id, slide.options, slide.question, slide.settings, slide.type]);

  const doSave = useCallback(
    async (
      overrides?: Partial<{
        options: string[];
        question: string;
        settings: SlideSettings;
        type: SlideType;
      }>,
    ) => {
      if (!pollId) return false;

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      pendingRef.current = {
        question: overrides?.question ?? pendingRef.current.question,
        type: overrides?.type ?? pendingRef.current.type,
        options: overrides?.options ?? pendingRef.current.options,
        settings: overrides?.settings ?? pendingRef.current.settings,
      };

      if (serializeSlideDraft(pendingRef.current) === savedSnapshotRef.current) {
        onSaveStatusChange?.("saved");
        return true;
      }

      if (isSavingRef.current) {
        queuedSaveRef.current = true;
        onSaveStatusChange?.("unsaved");
        return false;
      }

      isSavingRef.current = true;
      onSaveStatusChange?.("saving");

      try {
        const payload = { ...pendingRef.current };
        await updateSlide.mutateAsync({
          slideId: slide.id,
          ...payload,
        });
        savedSnapshotRef.current = serializeSlideDraft(payload);
        onSaveStatusChange?.("saved");
        onSaved?.();
        return true;
      } catch (error) {
        console.error("[PollSlideSave]", error);
        onSaveStatusChange?.("error");
        return false;
      } finally {
        isSavingRef.current = false;
        if (
          queuedSaveRef.current ||
          serializeSlideDraft(pendingRef.current) !== savedSnapshotRef.current
        ) {
          queuedSaveRef.current = false;
          saveTimerRef.current = window.setTimeout(() => {
            void doSave();
          }, 0);
        }
      }
    },
    [onSaveStatusChange, onSaved, pollId, slide.id, updateSlide],
  );

  const scheduleSave = useCallback(
    (delay = 900) => {
      if (!pollId) return;
      onSaveStatusChange?.("unsaved");
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        void doSave();
      }, delay);
    },
    [doSave, onSaveStatusChange, pollId],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const setQuestion = useCallback(
    (value: string) => {
      pendingRef.current.question = value;
      setQuestionState(value);
      scheduleSave();
    },
    [scheduleSave],
  );

  const setOptions = useCallback(
    (value: string[]) => {
      pendingRef.current.options = value;
      setOptionsState(value);
      scheduleSave();
    },
    [scheduleSave],
  );

  const setSettings = useCallback(
    (value: SlideSettings) => {
      pendingRef.current.settings = value;
      setSettingsState(value);
      scheduleSave();
    },
    [scheduleSave],
  );

  const setType = useCallback(
    (newType: SlideType) => {
      pendingRef.current.type = newType;
      setTypeState(newType);
      void doSave({ type: newType });
    },
    [doSave],
  );

  return {
    doSave,
    options,
    question,
    setOptions,
    setQuestion,
    setSettings,
    setType,
    settings,
    type,
  };
}
