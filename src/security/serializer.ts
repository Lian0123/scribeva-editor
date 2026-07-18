import type {
  ScribevaDocument,
  ScribevaMark,
  ScribevaNode,
} from "../core/types";
import { sanitizeHTML } from "./sanitizer";

const BLOCK_TYPES: Record<string, string> = {
  blockquote: "blockquote",
  codeBlock: "pre",
  figure: "figure",
  figcaption: "figcaption",
  heading1: "h1",
  heading2: "h2",
  heading3: "h3",
  heading4: "h4",
  heading5: "h5",
  heading6: "h6",
  horizontalRule: "hr",
  image: "img",
  listItem: "li",
  orderedList: "ol",
  paragraph: "p",
  table: "table",
  tableBody: "tbody",
  tableCell: "td",
  tableHead: "thead",
  tableHeader: "th",
  tableRow: "tr",
  unorderedList: "ul",
};

const TAG_TYPES: Record<string, string> = Object.fromEntries(
  Object.entries(BLOCK_TYPES).map(([key, value]) => [value, key]),
);

const MARK_TAGS: Record<string, ScribevaMark["type"]> = {
  a: "link",
  b: "bold",
  code: "code",
  del: "strike",
  em: "italic",
  i: "italic",
  s: "strike",
  strong: "bold",
  u: "underline",
};

function attrsFromElement(element: Element): Record<string, string> | undefined {
  const attrs = Object.fromEntries(
    Array.from(element.attributes)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ name, value }) => [name, value]),
  );
  return Object.keys(attrs).length ? attrs : undefined;
}

function nodesFromDOM(node: Node, marks: ScribevaMark[] = []): ScribevaNode[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    return text ? [{ type: "text", text, marks: marks.length ? marks : undefined }] : [];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  const markType = MARK_TAGS[tag];
  if (markType || (tag === "span" && element.hasAttribute("style"))) {
    const mark: ScribevaMark = {
      type: markType ?? "textStyle",
      attrs: attrsFromElement(element),
    };
    return Array.from(element.childNodes).flatMap((child) =>
      nodesFromDOM(child, [...marks, mark]),
    );
  }

  const type = TAG_TYPES[tag] ?? (tag === "br" ? "hardBreak" : "paragraph");
  if (type === "horizontalRule" || type === "image" || type === "hardBreak") {
    return [{ type, attrs: attrsFromElement(element) }];
  }

  return [
    {
      type,
      attrs: attrsFromElement(element),
      content: Array.from(element.childNodes).flatMap((child) =>
        nodesFromDOM(child, marks),
      ),
    },
  ];
}

export function htmlToJSON(input: string): ScribevaDocument {
  const html = sanitizeHTML(input);
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const content = Array.from(parsed.body.childNodes).flatMap((node) =>
    nodesFromDOM(node),
  );

  return {
    type: "doc",
    content: content.length ? content : [{ type: "paragraph", content: [] }],
  };
}

function escapeText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderAttributes(attrs?: Record<string, string>): string {
  if (!attrs) return "";
  return Object.entries(attrs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, value]) =>
        ` ${key}="${value
          .replaceAll("&", "&amp;")
          .replaceAll('"', "&quot;")
          .replaceAll("<", "&lt;")}"`,
    )
    .join("");
}

function wrapMark(html: string, mark: ScribevaMark): string {
  const tag: Record<ScribevaMark["type"], string> = {
    bold: "strong",
    italic: "em",
    underline: "u",
    strike: "s",
    code: "code",
    link: "a",
    textStyle: "span",
  };
  return `<${tag[mark.type]}${renderAttributes(mark.attrs)}>${html}</${tag[mark.type]}>`;
}

function nodeToHTML(node: ScribevaNode): string {
  if (node.type === "text") {
    return (node.marks ?? []).reduce(
      (html, mark) => wrapMark(html, mark),
      escapeText(node.text ?? ""),
    );
  }

  if (node.type === "hardBreak") return "<br>";
  const tag = BLOCK_TYPES[node.type] ?? "p";
  const attributes = renderAttributes(node.attrs);
  if (tag === "hr" || tag === "img") return `<${tag}${attributes}>`;
  const content = (node.content ?? []).map(nodeToHTML).join("");
  return `<${tag}${attributes}>${content}</${tag}>`;
}

export function jsonToHTML(document: ScribevaDocument): string {
  return sanitizeHTML(document.content.map(nodeToHTML).join(""));
}
