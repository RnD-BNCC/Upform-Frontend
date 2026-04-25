import { resolveReferenceHtml } from "@/utils/form/referenceTokens";
import type { FormSection } from "@/types/form";
import CoverPageLayout, {
  type CoverPageThemeConfig,
} from "@/components/builder/preview/cover/CoverPageLayout";

type Props = {
  containerClassName?: string;
  section: FormSection;
  themeConfig: CoverPageThemeConfig;
  onStart: () => void;
};

function CoverContent({
  html,
  className,
}: {
  html: string;
  className: string;
}) {
  if (!html) return <div className={className} />;

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function RuntimeCoverPagePreview({
  containerClassName,
  section,
  themeConfig,
  onStart,
}: Props) {
  const settings = section.settings ?? {};
  const coverTitle = resolveReferenceHtml((settings.coverTitle as string) ?? "");
  const coverDescription = resolveReferenceHtml(
    (settings.coverDescription as string) ?? "",
  );

  return (
    <CoverPageLayout
      containerClassName={containerClassName}
      coverBgImage={(settings.coverBgImage as string) ?? null}
      coverHeroImage={(settings.coverHeroImage as string) ?? null}
      coverLayout={Number(settings.coverLayout ?? 0)}
      descriptionContent={
        <CoverContent
          html={coverDescription}
          className={`w-full leading-relaxed ${
            Number(settings.coverLayout ?? 0) >= 3 ? "text-center text-base" : "text-base"
          }`}
        />
      }
      startButtonLabel={(settings.startButtonText as string) ?? "Start"}
      themeConfig={themeConfig}
      titleContent={
        <CoverContent
          html={coverTitle}
          className={`w-full font-bold italic leading-tight ${
            Number(settings.coverLayout ?? 0) >= 3
              ? "text-center text-4xl"
              : "text-3xl"
          }`}
        />
      }
      onStart={onStart}
    />
  );
}
