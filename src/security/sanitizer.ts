const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "col",
  "colgroup",
  "del",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const DROP_CONTENT_TAGS = new Set([
  "applet",
  "audio",
  "embed",
  "form",
  "iframe",
  "math",
  "object",
  "script",
  "style",
  "svg",
  "template",
  "video",
]);

const GLOBAL_ATTRIBUTES = new Set(["class", "dir", "lang", "title"]);

const TAG_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
  col: new Set(["span", "width"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  ol: new Set(["start", "type"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan", "scope"]),
};

const ALLOWED_STYLES = new Set([
  "background-color",
  "border-color",
  "border-bottom-color",
  "border-bottom-style",
  "border-bottom-width",
  "border-left-color",
  "border-left-style",
  "border-left-width",
  "border-right-color",
  "border-right-style",
  "border-right-width",
  "border-style",
  "border-top-color",
  "border-top-style",
  "border-top-width",
  "border-width",
  "color",
  "column-count",
  "column-gap",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "margin-left",
  "text-align",
  "text-decoration",
  "vertical-align",
]);

function documentImplementation(): Document {
  if (typeof document === "undefined") {
    throw new Error(
      "Scribeva HTML conversion requires a browser DOM. Call it after the document is available.",
    );
  }
  return document.implementation.createHTMLDocument("scribeva");
}

function sanitizeUrl(value: string, kind: "link" | "image"): string | null {
  const normalized = value.trim().replace(/[\u0000-\u001F\u007F\s]+/g, "");
  if (!normalized) return null;

  if (
    normalized.startsWith("#") ||
    normalized.startsWith("/") ||
    normalized.startsWith("./") ||
    normalized.startsWith("../")
  ) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized, "https://scribeva.invalid");
    const allowed =
      kind === "image"
        ? ["http:", "https:", "blob:"]
        : ["http:", "https:", "mailto:", "tel:"];
    return allowed.includes(parsed.protocol) ? value.trim() : null;
  } catch {
    return null;
  }
}

function sanitizeStyle(value: string): string {
  const safe: string[] = [];

  for (const declaration of value.split(";")) {
    const separator = declaration.indexOf(":");
    if (separator < 1) continue;

    const property = declaration.slice(0, separator).trim().toLowerCase();
    const rawValue = declaration.slice(separator + 1).trim();
    if (!ALLOWED_STYLES.has(property) || !rawValue) continue;
    if (/url\s*\(|expression\s*\(|javascript:|@import/i.test(rawValue)) continue;
    if (property === "column-count" && !/^[1-4]$/.test(rawValue)) continue;
    if (property === "column-gap") {
      const match = /^(\d+(?:\.\d+)?)(px|em|rem)?$/.exec(rawValue);
      if (!match) continue;
      const amount = Number(match[1]);
      const maximum = match[2] === "px" || !match[2] ? 200 : 12;
      if (!Number.isFinite(amount) || amount > maximum) continue;
    }

    safe.push(`${property}: ${rawValue}`);
  }

  return safe.sort().join("; ");
}

function copySafeAttributes(source: Element, target: HTMLElement): void {
  const tag = source.tagName.toLowerCase();
  const tagAttributes = TAG_ATTRIBUTES[tag] ?? new Set<string>();

  for (const attribute of Array.from(source.attributes)) {
    const name = attribute.name.toLowerCase();
    if (name.startsWith("on") || name === "id") continue;

    if (name === "style") {
      const style = sanitizeStyle(attribute.value);
      if (style) target.setAttribute("style", style);
      continue;
    }

    if (!GLOBAL_ATTRIBUTES.has(name) && !tagAttributes.has(name)) continue;

    if (name === "href" || name === "src") {
      const safeUrl = sanitizeUrl(
        attribute.value,
        name === "src" ? "image" : "link",
      );
      if (safeUrl) target.setAttribute(name, safeUrl);
      continue;
    }

    if (name === "target" && attribute.value !== "_blank") continue;
    if (
      ["width", "height", "colspan", "rowspan", "span", "start"].includes(
        name,
      ) &&
      !/^\d{1,4}$/.test(attribute.value)
    ) {
      continue;
    }

    target.setAttribute(name, attribute.value);
  }

  if (tag === "a" && target.getAttribute("target") === "_blank") {
    target.setAttribute("rel", "noopener noreferrer");
  }
}

function sanitizeNode(node: Node, targetDocument: Document): Node[] {
  if (node.nodeType === Node.TEXT_NODE) {
    return [targetDocument.createTextNode(node.textContent ?? "")];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  if (DROP_CONTENT_TAGS.has(tag)) return [];

  const children = Array.from(element.childNodes).flatMap((child) =>
    sanitizeNode(child, targetDocument),
  );

  if (!ALLOWED_TAGS.has(tag)) return children;

  const clean = targetDocument.createElement(tag);
  copySafeAttributes(element, clean);
  clean.append(...children);
  return [clean];
}

function serializeElement(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const attributes = Array.from(element.attributes)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      ({ name, value }) =>
        ` ${name}="${value
          .replaceAll("&", "&amp;")
          .replaceAll('"', "&quot;")
          .replaceAll("<", "&lt;")}"`,
    )
    .join("");
  const voidTags = new Set(["br", "col", "hr", "img"]);
  if (voidTags.has(tag)) return `<${tag}${attributes}>`;
  return `<${tag}${attributes}>${Array.from(element.childNodes)
    .map(serializeNode)
    .join("")}</${tag}>`;
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
  return node.nodeType === Node.ELEMENT_NODE
    ? serializeElement(node as Element)
    : "";
}

export function sanitizeHTML(input: string): string {
  const outputDocument = documentImplementation();
  const source = new DOMParser().parseFromString(input, "text/html");

  const sanitized = Array.from(source.body.childNodes).flatMap((node) =>
    sanitizeNode(node, outputDocument),
  );
  outputDocument.body.append(...sanitized);

  return Array.from(outputDocument.body.childNodes).map(serializeNode).join("");
}

export function normalizePastedHTML(input: string): string {
  const withoutOfficeMetadata = input
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, "")
    .replace(/<\/?o:[^>]*>/gi, "")
    .replace(/\sclass=(?:"|')?Mso[^\s>"']*(?:"|')?/gi, "")
    .replace(/\smso-[^:]+:[^;"']+;?/gi, "");

  return sanitizeHTML(withoutOfficeMetadata);
}
