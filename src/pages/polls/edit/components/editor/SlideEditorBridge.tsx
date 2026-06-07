import { useEffect } from "react";
import { useSlideState } from "@/pages/polls/edit/hooks";
import SettingsPanel from "@/pages/polls/edit/components/SettingsPanel";
import SlidePreview from "@/pages/polls/edit/components/SlidePreview";
import type { EditorSaveStatus } from "@/pages/polls/edit/types";
import type { PollSlide } from "@/types/polling";

type SlideEditorBridgeProps = {
  code: string;
  onQuestionLive: (question: string | null) => void;
  onSaved: () => void;
  onSaveStatusChange: (status: EditorSaveStatus) => void;
  pollId: string;
  saveRef: React.MutableRefObject<(() => void) | null>;
  slide: PollSlide;
};

export default function SlideEditorBridge({
  code,
  onQuestionLive,
  onSaved,
  onSaveStatusChange,
  pollId,
  saveRef,
  slide,
}: SlideEditorBridgeProps) {
  const {
    doSave,
    options,
    question,
    setOptions,
    setQuestion,
    setSettings,
    setType,
    settings,
    type,
  } = useSlideState(slide, pollId, onSaveStatusChange, onSaved);

  useEffect(() => {
    saveRef.current = () => {
      void doSave();
    };
  }, [doSave, saveRef]);

  useEffect(() => {
    onQuestionLive(question);
    return () => onQuestionLive(null);
  }, [onQuestionLive, question]);

  return (
    <>
      <div className="flex flex-1 items-start justify-center overflow-y-auto p-4 pt-32 sm:p-8 sm:pt-8">
        <div className="max-h-3xl w-full max-w-3xl">
          <SlidePreview
            code={code}
            question={question}
            options={options}
            type={type}
            settings={settings}
            onQuestionChange={setQuestion}
            onQuestionBlur={(value) => void doSave({ question: value })}
          />
        </div>
      </div>

      <SettingsPanel
        type={type}
        options={options}
        settings={settings}
        onTypeChange={setType}
        onOptionsChange={setOptions}
        onSettingsChange={setSettings}
        onBlur={() => void doSave()}
      />
    </>
  );
}
