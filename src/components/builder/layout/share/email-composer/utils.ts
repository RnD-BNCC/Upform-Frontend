import type { EmailComposerDraft as ApiEmailComposerDraft } from "@/types/api";
import type { FormResponse, FormSection } from "@/types/form";
import type { ThemeConfig } from "@/utils/form/themeConfig";
import {
  DEFAULT_IMAGE_MAX_HEIGHT,
  DEFAULT_IMAGE_WIDTH,
  EMAIL_RE,
} from "./constants";
import type {
  EmailBlock,
  EmailComposerDraftState,
  EmailFieldSource,
  EmailStyle,
  ImageAlignment,
  ImageBlock,
} from "@/types/builderShare";

let uidCounter = 0;

export function uid() {
  uidCounter += 1;
  return `blk-${uidCounter}-${Date.now()}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function linkifyEscapedText(value: string, linkColor = "#0054a5") {
  return value.replace(
    /(https?:\/\/[^\s<]+)/g,
    `<a href="$1" style="color:${linkColor};text-decoration:underline;">$1</a>`,
  );
}

function textToRichHtml(value: string, linkColor = "#0054a5") {
  return linkifyEscapedText(escapeHtml(value), linkColor).replace(
    /\r?\n/g,
    "<br />",
  );
}

function getEmailFontFamily(fontFamily: string) {
  return escapeHtml(fontFamily.replace(/"/g, "'"));
}

function createInitialTextHtml(publicFormUrl: string) {
  const safeUrl = escapeHtml(publicFormUrl);
  return `Hi there,<br /><br />I've invited you to fill out a form:<br /><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
}

export function createDefaultDraft(
  formTitle: string,
  publicFormUrl: string,
): EmailComposerDraftState {
  return {
    blocks: [
      {
        content: createInitialTextHtml(publicFormUrl),
        id: uid(),
        type: "text",
      },
    ],
    emailStyle: "formatted",
    emailThemeValue: null,
    excludedRecipients: [],
    manualRecipients: [],
    recipientMode: "manual",
    selectedEmailFieldIds: [],
    subject: `Fill out: ${formTitle}`,
  };
}

function isEmailBlock(value: unknown): value is EmailBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as Partial<EmailBlock>;
  if (typeof block.id !== "string") return false;
  if (block.type === "text") return typeof block.content === "string";
  if (block.type === "image") return typeof block.url === "string";
  if (block.type === "spacer") return typeof block.height === "number";
  return false;
}

function normalizeEmailDraft(
  draft: ApiEmailComposerDraft | null | undefined,
  formTitle: string,
  publicFormUrl: string,
) {
  const defaults = createDefaultDraft(formTitle, publicFormUrl);
  if (!draft) return defaults;

  const blocks = Array.isArray(draft.blocks)
    ? draft.blocks.filter(isEmailBlock)
    : defaults.blocks;

  return {
    blocks: blocks.length > 0 ? blocks : defaults.blocks,
    emailStyle:
      draft.emailStyle === "basic" || draft.emailStyle === "formatted"
        ? draft.emailStyle
        : defaults.emailStyle,
    emailThemeValue:
      typeof draft.emailThemeValue === "string"
        ? draft.emailThemeValue
        : defaults.emailThemeValue,
    excludedRecipients: Array.isArray(draft.excludedRecipients)
      ? draft.excludedRecipients
      : defaults.excludedRecipients,
    manualRecipients: Array.isArray(draft.manualRecipients)
      ? draft.manualRecipients
      : defaults.manualRecipients,
    recipientMode:
      draft.recipientMode === "field" || draft.recipientMode === "manual"
        ? draft.recipientMode
        : defaults.recipientMode,
    selectedEmailFieldIds: Array.isArray(draft.selectedEmailFieldIds)
      ? draft.selectedEmailFieldIds
      : defaults.selectedEmailFieldIds,
    subject: draft.subject?.trim() ? draft.subject : defaults.subject,
  };
}

export function serializeEmailDraft(draft: EmailComposerDraftState) {
  return JSON.stringify({
    blocks: draft.blocks,
    emailStyle: draft.emailStyle,
    emailThemeValue: draft.emailThemeValue,
    excludedRecipients: [...draft.excludedRecipients].sort(),
    manualRecipients: [...draft.manualRecipients].sort(),
    recipientMode: draft.recipientMode,
    selectedEmailFieldIds: [...draft.selectedEmailFieldIds].sort(),
    subject: draft.subject,
  });
}

export function toSaveEmailDraftPayload(
  eventId: string,
  draft: EmailComposerDraftState,
) {
  return {
    blocks: draft.blocks,
    emailStyle: draft.emailStyle,
    emailThemeValue: draft.emailThemeValue,
    eventId,
    excludedRecipients: draft.excludedRecipients,
    manualRecipients: draft.manualRecipients,
    recipientMode: draft.recipientMode,
    selectedEmailFieldIds: draft.selectedEmailFieldIds,
    subject: draft.subject,
  };
}

export function isEventNotFound(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { response?: { status?: number } };
  return maybeError.response?.status === 404;
}

export function normalizeEmailDraftForSave(
  draft: EmailComposerDraftState,
  formTitle: string,
  publicFormUrl: string,
) {
  if (draft.blocks.length > 0) return draft;
  const defaults = createDefaultDraft(formTitle, publicFormUrl);
  return {
    ...draft,
    blocks: defaults.blocks,
  };
}

export function getEmailDraftFromApi(
  draft: ApiEmailComposerDraft | null | undefined,
  formTitle: string,
  publicFormUrl: string,
) {
  try {
    return normalizeEmailDraft(draft, formTitle, publicFormUrl);
  } catch {
    return createDefaultDraft(formTitle, publicFormUrl);
  }
}

export function sanitizeRichTextHtml(content: string, linkColor = "#0054a5") {
  if (!content.trim()) return "";
  if (!/[<>&]/.test(content)) return textToRichHtml(content, linkColor);
  if (typeof document === "undefined") return textToRichHtml(content, linkColor);

  const template = document.createElement("template");
  template.innerHTML = content;
  const allowedTags = new Set([
    "a",
    "b",
    "blockquote",
    "br",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "i",
    "li",
    "ol",
    "p",
    "s",
    "span",
    "strike",
    "strong",
    "u",
    "ul",
  ]);
  const removableTags = new Set([
    "audio",
    "canvas",
    "iframe",
    "img",
    "object",
    "picture",
    "script",
    "style",
    "svg",
    "video",
  ]);
  const blockTags = new Set([
    "blockquote",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "li",
    "ol",
    "p",
    "ul",
  ]);

  const sanitizeElement = (element: Element) => {
    const tag = element.tagName.toLowerCase();

    if (removableTags.has(tag)) {
      element.remove();
      return;
    }

    Array.from(element.children).forEach(sanitizeElement);

    if (!allowedTags.has(tag)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    const htmlElement = element as HTMLElement;
    const textAlign = htmlElement.style.textAlign;
    const href = element.getAttribute("href");
    Array.from(element.attributes).forEach((attribute) =>
      element.removeAttribute(attribute.name),
    );

    if (tag === "a") {
      const cleanHref = href?.trim() ?? "";
      const isSafeHref = /^(https?:|mailto:|tel:)/i.test(cleanHref);
      if (!isSafeHref) {
        element.replaceWith(...Array.from(element.childNodes));
        return;
      }
      element.setAttribute("href", cleanHref);
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
      element.setAttribute(
        "style",
        `color:${linkColor};text-decoration:underline;`,
      );
      return;
    }

    const styles: string[] = [];
    if (blockTags.has(tag)) styles.push("margin:0;");
    if (["left", "center", "right"].includes(textAlign)) {
      styles.push(`text-align:${textAlign};`);
    }
    if (styles.length > 0) element.setAttribute("style", styles.join(""));
  };

  Array.from(template.content.children).forEach(sanitizeElement);

  const walker = document.createTreeWalker(
    template.content,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (parent?.closest("a")) return NodeFilter.FILTER_REJECT;
        return /(https?:\/\/[^\s<]+)/.test(node.nodeValue ?? "")
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    },
  );
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  textNodes.forEach((node) => {
    const text = node.nodeValue ?? "";
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    text.replace(/(https?:\/\/[^\s<]+)/g, (match, _url, offset: number) => {
      if (offset > cursor) {
        fragment.append(document.createTextNode(text.slice(cursor, offset)));
      }
      const anchor = document.createElement("a");
      anchor.href = match;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.setAttribute(
        "style",
        `color:${linkColor};text-decoration:underline;`,
      );
      anchor.textContent = match;
      fragment.append(anchor);
      cursor = offset + match.length;
      return match;
    });
    if (cursor < text.length) {
      fragment.append(document.createTextNode(text.slice(cursor)));
    }
    node.replaceWith(fragment);
  });

  return template.innerHTML;
}

function getImageAlignmentStyle(align: ImageAlignment = "center") {
  if (align === "right") return "text-align:right;";
  if (align === "left") return "text-align:left;";
  return "text-align:center;";
}

function normalizeEmailImageUrl(url: string) {
  const value = url.trim();
  if (!value || value.startsWith("blob:")) return "";
  if (/^https?:\/\//i.test(value) || /^data:image\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;

  const baseUrl =
    import.meta.env.VITE_API_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  if (!baseUrl) return value;

  try {
    return new URL(value, baseUrl).href;
  } catch {
    return value;
  }
}

export function hasLocalEmailImageUrl(blocks: EmailBlock[]) {
  return blocks.some(
    (block) => block.type === "image" && block.url.trim().startsWith("blob:"),
  );
}

export function getImageWrapperClassName(block: ImageBlock) {
  const align = block.align ?? "center";
  if (align === "left") return "justify-start";
  if (align === "right") return "justify-end";
  return "justify-center";
}

function renderImageHtml(block: ImageBlock) {
  const src = normalizeEmailImageUrl(block.url);
  if (!src) return "";

  const align = block.align ?? "center";
  const maxHeight = block.maxHeight ?? DEFAULT_IMAGE_MAX_HEIGHT;
  const width =
    align === "full"
      ? 100
      : Math.max(20, Math.min(100, block.width ?? DEFAULT_IMAGE_WIDTH));
  const tdAlign =
    align === "left" ? "left" : align === "right" ? "right" : "center";
  const imageHtml = `<img src="${escapeHtml(src)}" alt="" width="100%" style="display:block;width:100%;max-width:100%;max-height:${maxHeight}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:8px;margin:0 auto;" />`;
  const linkedImage =
    block.openLink && block.linkUrl?.trim()
      ? `<a href="${escapeHtml(block.linkUrl.trim())}" target="_blank" style="display:block;text-decoration:none;">${imageHtml}</a>`
      : imageHtml;

  return `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
  <tr>
    <td align="${tdAlign}" style="padding:0;${getImageAlignmentStyle(align)}">
      <table role="presentation" align="${tdAlign}" width="${width}%" border="0" cellspacing="0" cellpadding="0" style="width:${width}%;max-width:100%;border-collapse:collapse;margin:${align === "right" ? "0 0 0 auto" : align === "left" ? "0 auto 0 0" : "0 auto"};">
        <tr><td style="padding:0;">${linkedImage}</td></tr>
      </table>
    </td>
  </tr>
</table>`;
}

export function generateHtml(
  blocks: EmailBlock[],
  style: EmailStyle,
  theme: ThemeConfig,
): string {
  const fontFamily = getEmailFontFamily(theme.fontFamily);
  const blocksHtml = blocks
    .map((block) => {
      if (block.type === "text") {
        return `<div style="font-size:15px;line-height:1.6;color:${theme.textColor};">${sanitizeRichTextHtml(block.content, theme.btnBg)}</div>`;
      }

      if (block.type === "image" && block.url.trim()) {
        return renderImageHtml(block);
      }

      if (block.type === "spacer") {
        return `<div style="height:${block.height}px;"></div>`;
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");

  if (style === "basic") {
    return `<div style="font-family:${fontFamily};background:${theme.bg};color:${theme.textColor};max-width:660px;margin:0 auto;padding:28px 32px;">
${blocksHtml}
</div>`;
  }

  return `<div style="font-family:${fontFamily};background:${theme.canvasBg};padding:32px 16px;">
<div style="max-width:660px;margin:0 auto;">
  <div style="text-align:center;font-size:30px;line-height:1.2;font-weight:800;color:${theme.textColor};margin-bottom:18px;">UpForm</div>
  <div style="background:${theme.bg};border-radius:10px;padding:28px 32px;color:${theme.textColor};">
${blocksHtml}
  </div>
</div>
</div>`;
}

function extractEmailsFromValue(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values
    .flatMap((item) => item.split(/[\s,;]+/))
    .map((item) => item.trim().toLowerCase())
    .filter((item) => EMAIL_RE.test(item));
}

export function buildEmailFieldSources(
  sections: FormSection[],
  responses: FormResponse[],
): EmailFieldSource[] {
  return sections.flatMap((section) =>
    section.fields
      .filter(
        (field) =>
          field.type === "email" || field.validationPattern === "email",
      )
      .map((field) => {
        const emails = new Set<string>();
        responses.forEach((response) => {
          extractEmailsFromValue(response.answers[field.id]).forEach((email) =>
            emails.add(email),
          );
        });

        return {
          emails: Array.from(emails).sort(),
          fieldId: field.id,
          label: field.label?.trim() || "Untitled email field",
          pageTitle: section.title?.trim() || "Untitled page",
          type: field.type,
        };
      }),
  );
}
