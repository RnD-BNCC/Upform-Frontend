import type { PollSlide, SlideType } from "@/types/polling";
import GuessNumberInput from "./GuessNumberInput";
import MCInput from "./MCInput";
import PinOnImageInput from "./PinOnImageInput";
import QAInput from "./QAInput";
import ScaleInput from "./ScaleInput";
import WordCloudInput from "./WordCloudInput";

type Props = {
  slide: PollSlide;
  onSubmit: (value: unknown) => void;
  isPending: boolean;
  participantName: string;
};

export default function AudienceSlideInput({
  slide,
  onSubmit,
  isPending,
  participantName,
}: Props) {
  const settings = (slide.settings ?? {}) as Record<string, unknown>;

  switch (slide.type as SlideType) {
    case "word_cloud":
      return <WordCloudInput onSubmit={onSubmit} isPending={isPending} />;
    case "multiple_choice":
      return (
        <MCInput
          options={slide.options}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      );
    case "scales":
      return (
        <ScaleInput
          statements={slide.options}
          onSubmit={onSubmit}
          isPending={isPending}
          min={
            (settings.scaleMin as number) ??
            (settings.maxSelections as number) ??
            1
          }
          max={
            (settings.scaleMax as number) ?? (settings.maxWords as number) ?? 10
          }
          minLabel={settings.scaleMinLabel as string | undefined}
          maxLabel={settings.scaleMaxLabel as string | undefined}
          colors={(settings.scaleColors as string[]) ?? []}
        />
      );
    case "pin_on_image":
      return (
        <PinOnImageInput
          imageUrl={settings.pinImageUrl as string | undefined}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      );
    case "qa":
      return (
        <QAInput
          onSubmit={onSubmit}
          isPending={isPending}
          participantName={participantName}
        />
      );
    case "guess_number":
      return (
        <GuessNumberInput
          onSubmit={onSubmit}
          isPending={isPending}
          min={(settings.numberMin as number) ?? 0}
          max={(settings.numberMax as number) ?? 10}
        />
      );
    default:
      return null;
  }
}
