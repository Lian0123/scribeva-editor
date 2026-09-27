const BLOCK_TAGS = new Set([
  "blockquote",
  "div",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "ol",
  "p",
  "pre",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "ul",
]);

const VOID_TAGS = new Set(["br", "col", "hr", "img"]);

function escapeText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderAttributes(element: Element): string {
  return Array.from(element.attributes)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      ({ name, value }) =>
        ` ${name}="${value
          .replaceAll("&", "&amp;")
          .replaceAll('"', "&quot;")
          .replaceAll("<", "&lt;")}"`,
    )
    .join("");
}

function renderInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeText(node.textContent ?? "");
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  const attributes = renderAttributes(element);
  if (VOID_TAGS.has(tag)) return `<${tag}${attributes}>`;
  return `<${tag}${attributes}>${Array.from(element.childNodes)
    .map(renderInline)
    .join("")}</${tag}>`;
}

function hasBlockChild(element: Element): boolean {
  return Array.from(element.children).some((child) =>
    BLOCK_TAGS.has(child.tagName.toLowerCase()),
  );
}

function removeFormattingWhitespace(node: Node): void {
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const element = node as Element;
  const preserveWhitespace = element.tagName.toLowerCase() === "pre";
  for (const child of Array.from(element.childNodes)) {
    if (
      !preserveWhitespace &&
      child.nodeType === Node.TEXT_NODE &&
      !child.textContent?.trim()
    ) {
      child.remove();
    } else {
      removeFormattingWhitespace(child);
    }
  }
}

function renderBlock(element: Element, depth: number): string[] {
  const indent = "  ".repeat(depth);
  const tag = element.tagName.toLowerCase();
  const attributes = renderAttributes(element);
  if (VOID_TAGS.has(tag)) return [`${indent}<${tag}${attributes}>`];

  if (!hasBlockChild(element)) {
    return [
      `${indent}<${tag}${attributes}>${Array.from(element.childNodes)
        .map(renderInline)
        .join("")}</${tag}>`,
    ];
  }

  const lines = [`${indent}<${tag}${attributes}>`];
  let inlineBuffer: Node[] = [];
  const flushInline = (): void => {
    if (!inlineBuffer.length) return;
    const content = inlineBuffer.map(renderInline).join("");
    if (content) lines.push(`${"  ".repeat(depth + 1)}${content}`);
    inlineBuffer = [];
  };

  for (const child of Array.from(element.childNodes)) {
    const childElement =
      child.nodeType === Node.ELEMENT_NODE ? (child as Element) : null;
    if (childElement && BLOCK_TAGS.has(childElement.tagName.toLowerCase())) {
      flushInline();
      lines.push(...renderBlock(childElement, depth + 1));
    } else {
      inlineBuffer.push(child);
    }
  }
  flushInline();
  lines.push(`${indent}</${tag}>`);
  return lines;
}

/**
 * Creates readable HTML for the source editor without changing document HTML.
 * Whitespace-only nodes are intentionally ignored so formatting never becomes
 * visible document content or changes the JSON contract.
 */
export function formatHTML(input: string): string {
  if (typeof document === "undefined") return input;
  const parsed = new DOMParser().parseFromString(input, "text/html");
  const lines: string[] = [];

  for (const node of Array.from(parsed.body.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) lines.push(escapeText(text));
      continue;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tag = element.tagName.toLowerCase();
      lines.push(
        ...(BLOCK_TAGS.has(tag)
          ? renderBlock(element, 0)
          : [renderInline(element)]),
      );
    }
  }

  return lines.join("\n");
}

/** Removes indentation-only nodes before source is applied to the document. */
export function compactHTML(input: string): string {
  if (typeof document === "undefined") return input;
  const parsed = new DOMParser().parseFromString(input, "text/html");
  removeFormattingWhitespace(parsed.body);
  return parsed.body.innerHTML;
}
