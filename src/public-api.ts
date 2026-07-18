import "./styles.css";

import type { EditorOptions, ScribevaEditor } from "./core/types";
import { EditorShell } from "./ui/editor-shell";

export function createEditor(
  host: HTMLElement,
  options: EditorOptions = {},
): ScribevaEditor {
  return new EditorShell(host, options);
}

export function defineScribevaElement(
  tagName = "scribeva-editor",
): CustomElementConstructor | undefined {
  if (typeof window === "undefined" || typeof customElements === "undefined") {
    return undefined;
  }
  if (customElements.get(tagName)) return customElements.get(tagName);

  class ScribevaElement extends HTMLElement {
    editor?: ScribevaEditor;

    connectedCallback(): void {
      if (this.editor) return;
      this.editor = createEditor(this, {
        locale: this.getAttribute("locale") ?? "zh-TW",
        theme:
          (this.getAttribute("theme") as EditorOptions["theme"]) ?? "light",
        placeholder: this.getAttribute("placeholder") ?? undefined,
        readOnly: this.hasAttribute("readonly"),
        initialHTML: this.innerHTML.trim() || undefined,
      });
    }

    disconnectedCallback(): void {
      this.editor?.destroy();
      this.editor = undefined;
    }
  }

  customElements.define(tagName, ScribevaElement);
  return ScribevaElement;
}

export { DocumentModel } from "./core/document-model";
export { EditorEngine } from "./browser/editor-engine";
export { sanitizeHTML, normalizePastedHTML } from "./security/sanitizer";
export { htmlToJSON, jsonToHTML } from "./security/serializer";
export { getLocale, registerLocale, en, ja, zhTW } from "./locales";
export type {
  EditorChange,
  EditorCommand,
  EditorCommandContext,
  EditorLocale,
  EditorOptions,
  EditorPlugin,
  EditorTheme,
  ScribevaDocument,
  ScribevaEditor,
  ScribevaMark,
  ScribevaNode,
} from "./core/types";
