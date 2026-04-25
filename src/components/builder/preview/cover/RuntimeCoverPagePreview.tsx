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

const COVER_RICH_TEXT_CLASS =
  "[&_a]:underline [&_b]:font-bold [&_strong]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_s]:line-through [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:leading-normal";
const COVER_TITLE_RICH_TEXT_CLASS =
  `${COVER_RICH_TEXT_CLASS} [&_h1]:text-5xl [&_h1]:font-black [&_h2]:text-4xl [&_h2]:font-black [&_h3]:text-3xl [&_h3]:font-bold [&_h4]:text-2xl [&_h4]:font-bold [&_h5]:text-xl [&_h5]:font-bold`;
const COVER_DESCRIPTION_RICH_TEXT_CLASS =
  `${COVER_RICH_TEXT_CLASS} [&_h1]:text-3xl [&_h1]:font-black [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_h4]:text-lg [&_h4]:font-semibold [&_h5]:text-base [&_h5]:font-semibold`;

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
          className={`${COVER_DESCRIPTION_RICH_TEXT_CLASS} w-full leading-relaxed ${
            Number(settings.coverLayout ?? 0) >= 3 ? "text-center text-base" : "text-base"
          }`}
        />
      }
      startButtonLabel={(settings.startButtonText as string) ?? "Start"}
      themeConfig={themeConfig}
      titleContent={
        <CoverContent
          html={coverTitle}
          className={`${COVER_TITLE_RICH_TEXT_CLASS} w-full font-bold italic leading-tight ${
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
