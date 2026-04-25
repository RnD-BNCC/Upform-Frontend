import type { ThemeConfig } from "@/utils/form/themeConfig";
import {
  DEFAULT_IMAGE_MAX_HEIGHT,
  DEFAULT_IMAGE_WIDTH,
} from "../constants";
import type { EmailBlock, EmailStyle } from "@/types/builderShare";
import {
  getImageWrapperClassName,
  sanitizeRichTextHtml,
} from "../utils";

type EmailBlocksPreviewProps = {
  blocks: EmailBlock[];
  emailStyle: EmailStyle;
  theme: ThemeConfig;
};

export default function EmailBlocksPreview({
  blocks,
  emailStyle,
  theme,
}: EmailBlocksPreviewProps) {
  return (
    <div
      className={`h-full min-h-[28rem] overflow-hidden rounded-lg border border-gray-200 shadow-xl ${
        emailStyle === "formatted" ? "p-8" : "p-0"
      }`}
      style={{
        background: emailStyle === "formatted" ? theme.canvasBg : theme.bg,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
      }}
    >
      {emailStyle === "formatted" ? (
        <div className="mb-6 text-center text-3xl font-extrabold leading-none">
          UpForm
        </div>
      ) : null}
      <div
        className={`h-full min-h-[22rem] space-y-2 p-8 ${
          emailStyle === "formatted" ? "rounded-lg" : ""
        }`}
        style={{ background: theme.bg }}
      >
        {blocks.map((block) => {
          if (block.type === "text") {
            return (
              <div
                key={block.id}
                className="text-sm leading-relaxed [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichTextHtml(block.content, theme.btnBg),
                }}
              />
            );
          }

          if (block.type === "image" && block.url.trim()) {
            const align = block.align ?? "center";
            const width =
              align === "full"
                ? 100
                : Math.max(
                    20,
                    Math.min(100, block.width ?? DEFAULT_IMAGE_WIDTH),
                  );
            return (
              <div
                key={block.id}
                className={`flex w-full ${getImageWrapperClassName(block)}`}
              >
                <img
                  src={block.url}
                  alt=""
                  className="block h-auto rounded-md object-cover"
                  style={{
                    maxHeight: block.maxHeight ?? DEFAULT_IMAGE_MAX_HEIGHT,
                    width: `${width}%`,
                  }}
                />
              </div>
            );
          }

          if (block.type === "spacer") {
            return <div key={block.id} style={{ height: block.height }} />;
          }

          return null;
        })}
      </div>
    </div>
  );
}
