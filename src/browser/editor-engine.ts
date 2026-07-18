import { DocumentModel } from "../core/document-model";
import type {
  EditorChange,
  EditorCommand,
  EditorCommandContext,
  EditorPlugin,
  ScribevaDocument,
} from "../core/types";
import { createDefaultCommands } from "./commands";
import { normalizePastedHTML, sanitizeHTML } from "../security/sanitizer";

export class EditorEngine implements EditorCommandContext {
  readonly element: HTMLElement;
  readonly #model: DocumentModel;
  readonly #commands = new Map<string, EditorCommand>();
  readonly #listeners = new Set<(change: EditorChange) => void>();
  readonly #plugins: EditorPlugin[];
  readonly #abortController = new AbortController();
  #composing = false;
  #destroyed = false;
  #historyTimer: ReturnType<typeof setTimeout> | undefined;
  #skipNextModelRender = false;

  constructor(
    element: HTMLElement,
    initialHTML: string,
    plugins: EditorPlugin[] = [],
  ) {
    this.element = element;
    this.setHTML = this.setHTML.bind(this);
    this.commit = this.commit.bind(this);
    this.focus = this.focus.bind(this);
    this.#model = new DocumentModel(initialHTML);
    this.#plugins = plugins;

    Object.entries(createDefaultCommands()).forEach(([name, command]) =>
      this.#commands.set(name, command),
    );
    plugins.forEach((plugin) =>
      Object.entries(plugin.commands ?? {}).forEach(([name, command]) =>
        this.#commands.set(name, command),
      ),
    );

    this.#render();
    this.#bindEvents();
    this.#model.subscribe((change) => {
      if (this.#skipNextModelRender) {
        this.#skipNextModelRender = false;
      } else if (change.source !== "input" && change.source !== "paste") {
        this.#render();
      }
      this.#listeners.forEach((listener) => listener(change));
    });
    plugins.forEach((plugin) => plugin.onCreate?.(this));
  }

  getHTML(): string {
    return this.#model.html;
  }

  getJSON(): ScribevaDocument {
    return this.#model.json;
  }

  get canUndo(): boolean {
    return this.#model.canUndo;
  }

  get canRedo(): boolean {
    return this.#model.canRedo;
  }

  setHTML(html: string, source: EditorChange["source"] = "api"): void {
    this.#flushHistoryCheckpoint();
    this.#model.apply({ html, source });
  }

  setJSON(document: ScribevaDocument): void {
    this.#flushHistoryCheckpoint();
    this.#model.setJSON(document);
  }

  commit(source: EditorChange["source"] = "command"): void {
    const before = this.element.innerHTML;
    const sanitized = sanitizeHTML(before);
    const isTyping = source === "input";
    this.#skipNextModelRender = true;
    const changed = this.#model.apply({
      html: sanitized || "<p></p>",
      source,
      addToHistory: !isTyping,
    });
    if (!changed) this.#skipNextModelRender = false;
    if (isTyping) this.#scheduleHistoryCheckpoint();
  }

  focus(): void {
    this.element.focus();
  }

  setReadOnly(readOnly: boolean): void {
    this.element.contentEditable = String(!readOnly);
    this.element.setAttribute("aria-readonly", String(readOnly));
  }

  exec(name: string, value?: unknown): boolean {
    if (name === "undo") {
      this.#flushHistoryCheckpoint();
      const changed = this.#model.undo();
      if (changed) this.#render();
      return changed;
    }
    if (name === "redo") {
      this.#flushHistoryCheckpoint();
      const changed = this.#model.redo();
      if (changed) this.#render();
      return changed;
    }
    const command = this.#commands.get(name);
    if (!command) return false;
    this.#flushHistoryCheckpoint();
    return command(this, value) !== false;
  }

  registerCommand(name: string, command: EditorCommand): () => void {
    this.#commands.set(name, command);
    return () => this.#commands.delete(name);
  }

  onChange(listener: (change: EditorChange) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    if (this.#historyTimer) clearTimeout(this.#historyTimer);
    this.#historyTimer = undefined;
    this.#abortController.abort();
    this.#listeners.clear();
    this.#plugins.forEach((plugin) => plugin.onDestroy?.());
    this.element.removeAttribute("contenteditable");
    this.element.removeAttribute("role");
    this.element.removeAttribute("aria-multiline");
  }

  #render(): void {
    this.element.innerHTML = this.#model.html || "<p></p>";
  }

  #bindEvents(): void {
    const signal = this.#abortController.signal;

    this.element.addEventListener(
      "beforeinput",
      (event) => {
        if (event.inputType === "historyUndo") {
          event.preventDefault();
          this.exec("undo");
        } else if (event.inputType === "historyRedo") {
          event.preventDefault();
          this.exec("redo");
        }
      },
      { signal },
    );

    this.element.addEventListener(
      "input",
      () => {
        if (!this.#composing) this.commit("input");
      },
      { signal },
    );

    this.element.addEventListener(
      "compositionstart",
      () => {
        this.#composing = true;
      },
      { signal },
    );

    this.element.addEventListener(
      "compositionend",
      () => {
        this.#composing = false;
        this.commit("input");
      },
      { signal },
    );

    this.element.addEventListener(
      "paste",
      (event) => {
        event.preventDefault();
        this.#flushHistoryCheckpoint();
        const html = event.clipboardData?.getData("text/html");
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const safe = html
          ? normalizePastedHTML(html)
          : `<p>${text
              .replaceAll("&", "&amp;")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")
              .replace(/\r?\n/g, "<br>")}</p>`;
        this.#insertFragment(safe);
        this.commit("paste");
      },
      { signal },
    );

    this.element.addEventListener(
      "keydown",
      (event) => {
        const modifier = event.metaKey || event.ctrlKey;
        if (!modifier) return;
        const shortcuts: Record<string, string> = {
          a: "selectAll",
          b: "bold",
          i: "italic",
          u: "underline",
          z: event.shiftKey ? "redo" : "undo",
          y: "redo",
        };
        const normalizedKey = event.code.startsWith("Key")
          ? event.code.slice(3).toLowerCase()
          : event.key.toLowerCase();
        const command = shortcuts[normalizedKey];
        if (!command) return;
        event.preventDefault();
        this.exec(command);
      },
      { signal },
    );
  }

  #insertFragment(html: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!this.element.contains(range.commonAncestorContainer)) return;
    range.deleteContents();
    const template = document.createElement("template");
    template.innerHTML = html;
    const fragment = template.content;
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);
    if (!lastNode) return;
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  #scheduleHistoryCheckpoint(): void {
    if (this.#historyTimer) clearTimeout(this.#historyTimer);
    this.#historyTimer = setTimeout(() => {
      this.#model.checkpoint();
      this.#historyTimer = undefined;
    }, 500);
  }

  #flushHistoryCheckpoint(): void {
    if (this.#historyTimer) clearTimeout(this.#historyTimer);
    this.#historyTimer = undefined;
    this.#model.checkpoint();
  }
}
