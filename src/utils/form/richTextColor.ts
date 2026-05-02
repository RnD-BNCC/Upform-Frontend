function isColorStyleDeclaration(declaration: string) {
  const property = declaration.split(":")[0]?.trim().toLowerCase();
  if (!property) return false;

  return (
    property === "background" ||
    property === "color" ||
    property === "fill" ||
    property === "stroke" ||
    property === "text-fill-color" ||
    property === "-webkit-text-fill-color" ||
    property.endsWith("-color")
  );
}

export function stripRichTextColorStyles(html: string) {
  if (!html) return html;

  return html
    .replace(/\sstyle=(["'])(.*?)\1/gi, (_match, quote: string, style: string) => {
      const cleanedStyle = style
        .split(";")
        .map((declaration) => declaration.trim())
        .filter(
          (declaration) =>
            declaration && !isColorStyleDeclaration(declaration),
        )
        .join("; ");

      return cleanedStyle ? ` style=${quote}${cleanedStyle}${quote}` : "";
    })
    .replace(/\scolor=(["']).*?\1/gi, "")
    .replace(/\scolor=[^\s>]+/gi, "")
    .replace(/\s(?:bgcolor|text)=(["']).*?\1/gi, "")
    .replace(/\s(?:bgcolor|text)=[^\s>]+/gi, "")
    .replace(/<font\b[^>]*>/gi, "")
    .replace(/<\/font>/gi, "");
}
