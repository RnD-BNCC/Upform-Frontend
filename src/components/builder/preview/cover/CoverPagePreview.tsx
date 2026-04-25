import { RichInput } from "@/components/builder/utils";
import type { FormSection } from "@/types/form";
import CoverPageLayout, { type CoverPageThemeConfig } from "./CoverPageLayout";

type Props = {
  coverBgImage: string | null;
  coverHeroImage: string | null;
  coverLayout: number;
  section: FormSection;
  startButtonText: string;
  themeConfig: CoverPageThemeConfig;
  onDescriptionChange: (value: string) => void;
  onTitleChange: (value: string) => void;
};

export default function CoverPagePreview({
  coverBgImage,
  coverHeroImage,
  coverLayout,
  section,
  startButtonText,
  themeConfig,
  onDescriptionChange,
  onTitleChange,
}: Props) {
  const coverTitle = (section.settings?.coverTitle as string) ?? "";
  const coverDescription = (section.settings?.coverDescription as string) ?? "";

  return (
    <div
      className="flex h-full min-h-full flex-col"
      onClick={(event) => event.stopPropagation()}
    >
      <CoverPageLayout
        containerClassName="h-full min-h-full flex-1"
        coverBgImage={coverBgImage}
        coverHeroImage={coverHeroImage}
        coverLayout={coverLayout}
        descriptionContent={
          <RichInput
            value={coverDescription}
            onChange={onDescriptionChange}
            placeholder="Add a description..."
            className={`w-full bg-transparent outline-none border-none ${
              coverLayout >= 3 ? "text-center text-base" : "text-base"
            }`}
            stopPropagation
            noLists
          />
        }
        startButtonLabel={startButtonText}
        themeConfig={themeConfig}
        titleContent={
          <RichInput
            value={coverTitle}
            onChange={onTitleChange}
            placeholder="Type your title..."
            placeholderClassName={
              coverLayout === 3
                ? "text-center text-4xl font-bold italic text-white/50"
                : coverLayout >= 3
                  ? "text-center text-4xl font-bold italic text-gray-300"
                  : "text-3xl font-bold italic text-gray-300"
            }
            className={`w-full bg-transparent outline-none border-none font-bold italic ${
              coverLayout >= 3 ? "text-center text-4xl" : "text-3xl"
            }`}
            stopPropagation
            noLists
          />
        }
      />
    </div>
  );
}
