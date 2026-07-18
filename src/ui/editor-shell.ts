import type {
  EditorChange,
  EditorCommand,
  EditorOptions,
  ScribevaDocument,
  ScribevaEditor,
} from "../core/types";
import { EditorEngine } from "../browser/editor-engine";
import { getLocale, type ScribevaLocale } from "../locales";
import { icon } from "./icons";

type DialogKind = "link" | "image" | "table" | "emoji" | "preview";

const EMOJI = [
  "😀",
  "😂",
  "🥰",
  "😍",
  "🤩",
  "😊",
  "🙏",
  "👏",
  "👍",
  "👎",
  "🎉",
  "✨",
  "🔥",
  "💡",
  "✅",
  "⚠️",
  "❤️",
  "💬",
  "📌",
  "📎",
  "🚀",
  "🌏",
  "📝",
  "🔒",
];

export class EditorShell implements ScribevaEditor {
  readonly #host: HTMLElement;
  readonly #locale: ScribevaLocale;
  readonly #engine: EditorEngine;
  readonly #root: HTMLElement;
  readonly #content: HTMLElement;
  readonly #source: HTMLTextAreaElement;
  readonly #sourceLines: HTMLElement;
  readonly #sourcePosition: HTMLElement;
  readonly #status: HTMLElement;
  readonly #dialog: HTMLDialogElement;
  readonly #abortController = new AbortController();
  readonly #blobUrls = new Set<string>();
  #savedRange: Range | null = null;

  constructor(host: HTMLElement, options: EditorOptions = {}) {
    if (!(host instanceof HTMLElement)) {
      throw new TypeError("Scribeva requires a valid HTMLElement host.");
    }
    this.#host = host;
    this.#locale = getLocale(options.locale);
    this.#root = document.createElement("section");
    this.#root.className = `scribeva${options.className ? ` ${options.className}` : ""}`;
    this.#root.dataset.theme = options.theme ?? "light";
    this.#root.innerHTML = this.#shellMarkup();
    this.#host.append(this.#root);

    const content = this.#root.querySelector<HTMLElement>("[data-scribeva-content]");
    const status = this.#root.querySelector<HTMLElement>("[data-scribeva-status]");
    const source =
      this.#root.querySelector<HTMLTextAreaElement>("[data-scribeva-source]");
    const sourceLines =
      this.#root.querySelector<HTMLElement>("[data-source-lines]");
    const sourcePosition =
      this.#root.querySelector<HTMLElement>("[data-source-position]");
    const dialog = this.#root.querySelector<HTMLDialogElement>("dialog");
    if (!content || !source || !sourceLines || !sourcePosition || !status || !dialog) {
      throw new Error("Scribeva UI could not be initialized.");
    }
    this.#content = content;
    this.#source = source;
    this.#sourceLines = sourceLines;
    this.#sourcePosition = sourcePosition;
    this.#status = status;
    this.#dialog = dialog;

    this.#content.dataset.placeholder =
      options.placeholder ?? this.#locale.placeholder;
    this.#content.setAttribute(
      "aria-label",
      options.ariaLabel ?? this.#locale.placeholder,
    );
    this.#content.style.minHeight = options.minHeight ?? "680px";

    this.#engine = new EditorEngine(
      this.#content,
      options.initialJSON
        ? "<p></p>"
        : options.initialHTML ??
            "<h1>Welcome to Scribeva</h1><p>Create polished, portable HTML with a calm enterprise writing experience.</p>",
      options.plugins,
    );
    if (options.initialJSON) this.#engine.setJSON(options.initialJSON);
    this.#engine.setReadOnly(options.readOnly ?? false);
    this.#engine.onChange((change) => {
      this.#updateStatus();
      options.onChange?.(change);
    });

    this.#bindUI();
    this.#updateStatus();
    if (options.autofocus) queueMicrotask(() => this.focus());
  }

  getHTML(): string {
    return this.#engine.getHTML();
  }

  setHTML(html: string): void {
    this.#engine.setHTML(html);
    this.#updateStatus();
  }

  getJSON(): ScribevaDocument {
    return this.#engine.getJSON();
  }

  setJSON(document: ScribevaDocument): void {
    this.#engine.setJSON(document);
    this.#updateStatus();
  }

  focus(): void {
    this.#engine.focus();
  }

  destroy(): void {
    this.#abortController.abort();
    this.#engine.destroy();
    this.#blobUrls.forEach((url) => URL.revokeObjectURL(url));
    this.#blobUrls.clear();
    this.#root.remove();
  }

  setReadOnly(readOnly: boolean): void {
    this.#engine.setReadOnly(readOnly);
    this.#root.classList.toggle("is-readonly", readOnly);
  }

  insertImageBlob(blob: Blob, alt = ""): string {
    if (!blob.type.startsWith("image/")) {
      throw new TypeError("Scribeva only accepts image Blob values.");
    }
    const url = URL.createObjectURL(blob);
    this.#blobUrls.add(url);
    if (!this.exec("image", { src: url, alt })) {
      URL.revokeObjectURL(url);
      this.#blobUrls.delete(url);
      throw new Error("Place the caret in the document before inserting an image.");
    }
    return url;
  }

  exec(command: string, value?: unknown): boolean {
    this.#restoreSelection();
    const result = this.#engine.exec(command, value);
    this.#updateStatus();
    return result;
  }

  registerCommand(name: string, command: EditorCommand): () => void {
    return this.#engine.registerCommand(name, command);
  }

  on(
    event: "change",
    listener: (change: EditorChange) => void,
  ): () => void {
    if (event !== "change") return () => undefined;
    return this.#engine.onChange(listener);
  }

  #shellMarkup(): string {
    const l = this.#locale;
    return `
      <header class="scribeva__titlebar">
        <div class="scribeva__brand" aria-label="${l.appName}">
          <span class="scribeva__brand-mark">S</span>
          <span><strong>${l.appName}</strong><small>${l.chrome.brandTagline}</small></span>
        </div>
        <div class="scribeva__document-name">
          <span class="scribeva__save-state" aria-hidden="true"></span>
          <input value="${l.chrome.documentName}" aria-label="${l.chrome.documentNameLabel}">
        </div>
        <div class="scribeva__title-actions">
          <span class="scribeva__license">${l.chrome.license}</span>
          <button class="scribeva__icon-button" data-action="theme" title="${l.theme.dark}">
            ${icon("moon")}
          </button>
        </div>
      </header>

      <nav class="scribeva__tabs" role="tablist" aria-label="${l.chrome.editorTools}">
        <button role="tab" aria-selected="true" data-tab="home">${l.tabs.home}</button>
        <button role="tab" aria-selected="false" data-tab="insert">${l.tabs.insert}</button>
        <button role="tab" aria-selected="false" data-tab="view">${l.tabs.view}</button>
        <button role="tab" aria-selected="false" data-tab="html">${l.tabs.html}</button>
      </nav>

      <div class="scribeva__ribbon" data-panel="home">
        ${this.#historyGroup()}
        ${this.#textGroup()}
        ${this.#paragraphGroup()}
      </div>
      <div class="scribeva__ribbon" data-panel="insert" hidden>
        ${this.#insertGroup()}
      </div>
      <div class="scribeva__ribbon" data-panel="view" hidden>
        ${this.#viewGroup()}
      </div>
      <div class="scribeva__ribbon scribeva__ribbon--source" data-panel="html" hidden>
        ${this.#sourceGroup()}
      </div>

      <main class="scribeva__workspace">
        <div class="scribeva__page-wrap">
          <article
            class="scribeva__page"
            data-scribeva-content
            contenteditable="true"
            role="textbox"
            aria-multiline="true"
            spellcheck="true"
          ></article>
        </div>
        <section class="scribeva__source-workspace" data-source-workspace hidden>
          <div class="scribeva__source-gutter" data-source-lines aria-hidden="true">1</div>
          <textarea
            class="scribeva__source"
            data-scribeva-source
            aria-label="${l.chrome.sourceEditor}"
            wrap="off"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
          ></textarea>
        </section>
      </main>

      <footer class="scribeva__statusbar">
        <span class="scribeva__status-ready"><i></i>${l.status.ready}</span>
        <span data-scribeva-status></span>
        <span class="scribeva__status-spacer"></span>
        <label>${l.status.zoom}
          <input type="range" min="70" max="140" value="100" step="10" data-zoom>
          <output data-zoom-output>100%</output>
        </label>
      </footer>

      <dialog class="scribeva__dialog" aria-labelledby="scribeva-dialog-title">
        <form method="dialog" data-dialog-form>
          <header>
            <span class="scribeva__dialog-icon">${icon("link")}</span>
            <div>
              <h2 id="scribeva-dialog-title"></h2>
              <p>${l.chrome.dialogHint}</p>
            </div>
            <button type="button" data-dialog-cancel class="scribeva__dialog-close" aria-label="${l.dialog.cancel}">×</button>
          </header>
          <div class="scribeva__dialog-fields" data-dialog-fields></div>
          <footer>
            <button type="button" data-dialog-cancel class="scribeva__button scribeva__button--secondary">${l.dialog.cancel}</button>
            <button type="submit" class="scribeva__button scribeva__button--primary">${l.dialog.insert}</button>
          </footer>
        </form>
      </dialog>
    `;
  }

  #button(command: string, label: string, iconName?: string, text?: string): string {
    return `<button class="scribeva__tool" data-command="${command}" title="${label}">
      ${iconName ? icon(iconName) : `<span class="scribeva__tool-text">${text ?? label}</span>`}
      <small>${label}</small>
    </button>`;
  }

  #historyGroup(): string {
    const l = this.#locale;
    return `<section class="scribeva__group scribeva__group--compact">
      <div class="scribeva__tool-row">
        ${this.#button("undo", l.commands.undo, "undo")}
        ${this.#button("redo", l.commands.redo, "redo")}
      </div>
      <h3>${l.groups.history}</h3>
    </section>`;
  }

  #textGroup(): string {
    const l = this.#locale;
    return `<section class="scribeva__group scribeva__group--text">
      <div class="scribeva__control-row">
        <select data-command-select="fontFamily" aria-label="${l.chrome.fontFamily}">
          <option value="'Noto Sans TC', 'Noto Sans JP', 'Noto Sans', sans-serif">Noto Sans</option>
          <option value="'Noto Serif TC', 'Noto Serif JP', 'Noto Serif', serif">Noto Serif</option>
          <option value="'Noto Sans Mono', monospace">Noto Sans Mono</option>
        </select>
        <select data-command-select="fontSize" aria-label="${l.chrome.fontSize}">
          ${[12, 14, 16, 18, 20, 24, 32, 40]
            .map((size) => `<option value="${size}px"${size === 16 ? " selected" : ""}>${size}</option>`)
            .join("")}
        </select>
      </div>
      <div class="scribeva__control-row">
        ${this.#button("bold", l.commands.bold, undefined, "B")}
        ${this.#button("italic", l.commands.italic, undefined, "I")}
        ${this.#button("underline", l.commands.underline, undefined, "U")}
        ${this.#button("strike", l.commands.strike, undefined, "S")}
        ${this.#button("inlineCode", l.commands.inlineCode, undefined, "</>")}
        <label class="scribeva__color" title="Text color">A<input type="color" value="#1d2939" data-command-input="textColor"></label>
        <label class="scribeva__color scribeva__color--highlight" title="Highlight">A<input type="color" value="#fff0a6" data-command-input="highlight"></label>
      </div>
      <h3>${l.groups.text}</h3>
    </section>`;
  }

  #paragraphGroup(): string {
    const l = this.#locale;
    return `<section class="scribeva__group scribeva__group--paragraph">
      <div class="scribeva__control-row">
        <select data-block-select aria-label="Paragraph style">
          ${Object.entries(l.blocks)
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join("")}
        </select>
        ${this.#button("bulletList", l.commands.bulletList, "list")}
        ${this.#button("orderedList", l.commands.orderedList, "numbered")}
        ${this.#button("outdent", l.commands.outdent, "outdent")}
        ${this.#button("indent", l.commands.indent, "indent")}
      </div>
      <div class="scribeva__control-row">
        ${this.#button("align:left", l.commands.alignLeft, "alignLeft")}
        ${this.#button("align:center", l.commands.alignCenter, "alignCenter")}
        ${this.#button("align:right", l.commands.alignRight, "alignRight")}
        ${this.#button("align:justify", l.commands.justify, "justify")}
        <select data-command-select="lineHeight" aria-label="${l.chrome.lineHeight}">
          <option value="1.2">1.2</option>
          <option value="1.5" selected>1.5</option>
          <option value="1.75">1.75</option>
          <option value="2">2.0</option>
        </select>
      </div>
      <h3>${l.groups.paragraph}</h3>
    </section>`;
  }

  #insertGroup(): string {
    const l = this.#locale;
    return `<section class="scribeva__group">
      <div class="scribeva__large-tools">
        ${this.#button("dialog:link", l.commands.link, "link")}
        ${this.#button("dialog:image", l.commands.image, "image")}
        ${this.#button("imageUpload", l.commands.imageUpload, "image")}
        ${this.#button("dialog:table", l.commands.table, "table")}
        ${this.#button("dialog:emoji", l.commands.emoji, undefined, "😊")}
        ${this.#button("horizontalRule", l.commands.horizontalRule, "divider")}
      </div>
      <input type="file" accept="image/*" data-image-upload hidden>
      <h3>${l.groups.insert}</h3>
    </section>
    <section class="scribeva__group scribeva__group--table">
      <div class="scribeva__control-row">
        ${this.#button("tableAddRowBefore", l.commands.tableAddRowBefore, undefined, "↑+")}
        ${this.#button("tableAddRowAfter", l.commands.tableAddRowAfter, undefined, "↓+")}
        ${this.#button("tableDeleteRow", l.commands.tableDeleteRow, undefined, "−R")}
        ${this.#button("tableAddColumnBefore", l.commands.tableAddColumnBefore, undefined, "←+")}
        ${this.#button("tableAddColumnAfter", l.commands.tableAddColumnAfter, undefined, "→+")}
        ${this.#button("tableDeleteColumn", l.commands.tableDeleteColumn, undefined, "−C")}
      </div>
      <div class="scribeva__control-row">
        ${this.#button("tableHeaderRow", l.commands.tableHeaderRow, undefined, "TH")}
        ${this.#button("tableMergeRight", l.commands.tableMergeRight, undefined, "⇥")}
        ${this.#button("tableSplitCell", l.commands.tableSplitCell, undefined, "⇤")}
        ${this.#button("tableDelete", l.commands.tableDelete, undefined, "×")}
        <select data-command-select="tableVerticalAlign" aria-label="${l.commands.verticalTop}">
          <option value="top">${l.commands.verticalTop}</option>
          <option value="middle">${l.commands.verticalMiddle}</option>
          <option value="bottom">${l.commands.verticalBottom}</option>
        </select>
      </div>
      <div class="scribeva__control-row scribeva__table-style-row">
        <label class="scribeva__table-color" title="${l.commands.tableBorderColor}">
          <span aria-hidden="true">▦</span>
          <input type="color" value="#315f4c" data-command-input="tableBorderColor" aria-label="${l.commands.tableBorderColor}">
        </label>
        <label class="scribeva__table-color scribeva__table-color--fill" title="${l.commands.tableFillColor}">
          <span aria-hidden="true">▧</span>
          <input type="color" value="#e4eee8" data-command-input="tableFillColor" aria-label="${l.commands.tableFillColor}">
        </label>
        <select data-command-select="tableBorderWidth" aria-label="${l.commands.tableBorderWidth}">
          <option value="0">0 px</option>
          <option value="1" selected>1 px</option>
          <option value="2">2 px</option>
          <option value="3">3 px</option>
          <option value="4">4 px</option>
        </select>
        <select data-command-select="tableBorderStyle" aria-label="${l.commands.tableBorderStyle}">
          <option value="solid">━━</option>
          <option value="dashed">┅┅</option>
          <option value="dotted">┈┈</option>
          <option value="double">═</option>
        </select>
        <select data-table-borders aria-label="${l.commands.tableBorders}">
          <option value="" selected disabled>${l.commands.tableBorders}</option>
          <option value="top">${l.commands.borderTop}</option>
          <option value="bottom">${l.commands.borderBottom}</option>
          <option value="left">${l.commands.borderLeft}</option>
          <option value="right">${l.commands.borderRight}</option>
          <option value="horizontal">${l.commands.borderHorizontal}</option>
          <option value="vertical">${l.commands.borderVertical}</option>
          <option value="all">${l.commands.borderAll}</option>
          <option value="none">${l.commands.borderNone}</option>
        </select>
        ${this.#button("tableClearFormatting", l.commands.tableClearFormatting, undefined, "⌫")}
      </div>
      <h3>${l.groups.table}</h3>
    </section>`;
  }

  #viewGroup(): string {
    const l = this.#locale;
    return `<section class="scribeva__group">
      <div class="scribeva__large-tools">
        ${this.#button("view:focus", l.commands.focusMode, "focus")}
        ${this.#button("dialog:preview", l.commands.preview, "preview")}
        ${this.#button("view:print", l.commands.print, "print")}
        <label class="scribeva__theme-select">
          ${l.chrome.theme}
          <select data-theme-select>
            <option value="light">${l.theme.light}</option>
            <option value="dark">${l.theme.dark}</option>
            <option value="system">${l.theme.system}</option>
          </select>
        </label>
      </div>
      <h3>${l.groups.appearance}</h3>
    </section>`;
  }

  #sourceGroup(): string {
    const l = this.#locale;
    return `<section class="scribeva__group scribeva__group--source">
      <div class="scribeva__large-tools">
        ${this.#button("source:apply", l.commands.applyHTML, undefined, "✓ HTML")}
        ${this.#button("source:reset", l.commands.resetHTML, undefined, "↶")}
        ${this.#button("source:wrap", l.commands.toggleWordWrap, undefined, "↵")}
      </div>
      <div class="scribeva__source-help">
        <strong>&lt;/&gt; ${l.chrome.sourceEditor}</strong>
        <span>${l.chrome.sourceHint}</span>
        <output data-source-position>${l.chrome.line} 1 · ${l.chrome.column} 1</output>
      </div>
      <h3>${l.groups.document}</h3>
    </section>`;
  }

  #bindUI(): void {
    const signal = this.#abortController.signal;

    this.#root.addEventListener(
      "mousedown",
      (event) => {
        if ((event.target as Element).closest("[data-command]")) {
          this.#captureSelection();
          event.preventDefault();
        }
      },
      { signal },
    );

    this.#root.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element;
        const tab = target.closest<HTMLButtonElement>("[data-tab]");
        if (tab) this.#activateTab(tab.dataset.tab ?? "home");

        const button = target.closest<HTMLButtonElement>("[data-command]");
        if (button?.dataset.command) this.#handleCommand(button.dataset.command);

        if (target.closest('[data-action="theme"]')) this.#toggleTheme();
        if (target.closest("[data-dialog-cancel]")) this.#dialog.close("cancel");

        const emojiButton = target.closest<HTMLButtonElement>("[data-emoji]");
        if (emojiButton?.dataset.emoji) {
          this.#dialog.close("cancel");
          this.exec("insertText", emojiButton.dataset.emoji);
        }
      },
      { signal },
    );

    this.#root.addEventListener(
      "change",
      (event) => {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        if (target.matches("[data-image-upload]")) {
          const file = (target as HTMLInputElement).files?.[0];
          if (file) this.insertImageBlob(file, file.name);
          (target as HTMLInputElement).value = "";
        } else if (target.matches("[data-table-borders]")) {
          const color = this.#root.querySelector<HTMLInputElement>(
            '[data-command-input="tableBorderColor"]',
          )?.value;
          const width = this.#root.querySelector<HTMLSelectElement>(
            '[data-command-select="tableBorderWidth"]',
          )?.value;
          const style = this.#root.querySelector<HTMLSelectElement>(
            '[data-command-select="tableBorderStyle"]',
          )?.value;
          this.exec("tableBorders", {
            edges: target.value,
            color,
            width,
            style,
          });
          target.value = "";
        } else if (target.matches("[data-command-select]")) {
          this.exec(target.dataset.commandSelect!, target.value);
        } else if (target.matches("[data-command-input]")) {
          this.exec(target.dataset.commandInput!, target.value);
        } else if (target.matches("[data-block-select]")) {
          this.exec(target.value);
        } else if (target.matches("[data-theme-select]")) {
          this.#setTheme(target.value);
        }
      },
      { signal },
    );

    const zoom = this.#root.querySelector<HTMLInputElement>("[data-zoom]");
    zoom?.addEventListener(
      "input",
      () => {
        const scale = Number(zoom.value) / 100;
        this.#root.style.setProperty("--scribeva-zoom", String(scale));
        const output = this.#root.querySelector<HTMLOutputElement>(
          "[data-zoom-output]",
        );
        if (output) output.value = `${zoom.value}%`;
      },
      { signal },
    );

    this.#source.addEventListener("input", () => this.#updateSourceMetrics(), {
      signal,
    });
    this.#source.addEventListener(
      "scroll",
      () => {
        this.#sourceLines.scrollTop = this.#source.scrollTop;
      },
      { signal },
    );
    this.#source.addEventListener(
      "click",
      () => this.#updateSourceMetrics(),
      { signal },
    );
    this.#source.addEventListener(
      "keyup",
      () => this.#updateSourceMetrics(),
      { signal },
    );
    this.#source.addEventListener(
      "keydown",
      (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          this.#applySource();
          return;
        }
        if (event.key !== "Tab") return;
        event.preventDefault();
        const start = this.#source.selectionStart;
        const end = this.#source.selectionEnd;
        if (event.shiftKey) {
          const beforeSelection = this.#source.value.slice(
            Math.max(0, start - 2),
            start,
          );
          if (beforeSelection === "  ") {
            this.#source.setRangeText(
              "",
              start - 2,
              start,
              "preserve",
            );
            this.#source.setSelectionRange(start - 2, Math.max(start - 2, end - 2));
            this.#updateSourceMetrics();
            return;
          }
          const lineStart = this.#source.value.lastIndexOf("\n", start - 1) + 1;
          const removable = this.#source.value.slice(lineStart, lineStart + 2);
          const count = removable.startsWith("  ") ? 2 : removable.startsWith("\t") ? 1 : 0;
          if (count) {
            this.#source.setRangeText("", lineStart, lineStart + count, "preserve");
            this.#source.setSelectionRange(Math.max(lineStart, start - count), Math.max(lineStart, end - count));
          }
        } else {
          this.#source.setRangeText("  ", start, end, "end");
        }
        this.#updateSourceMetrics();
      },
      { signal },
    );

    document.addEventListener(
      "selectionchange",
      () => {
        if (document.activeElement === this.#content) {
          this.#captureSelection();
          this.#updateActiveTools();
          this.#updateStatus();
        }
      },
      { signal },
    );

    this.#dialog
      .querySelector<HTMLFormElement>("[data-dialog-form]")
      ?.addEventListener(
        "submit",
        (event) => {
          event.preventDefault();
          const form = event.currentTarget as HTMLFormElement;
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }
          this.#submitDialog();
          this.#dialog.close("confirm");
        },
        { signal },
      );

    this.#dialog.addEventListener(
      "cancel",
      (event) => {
        event.preventDefault();
        this.#dialog.close("cancel");
      },
      { signal },
    );
  }

  #activateTab(name: string): void {
    const leavingSource =
      this.#root.querySelector('[data-tab="html"]')?.getAttribute("aria-selected") ===
        "true" && name !== "html";
    if (leavingSource) this.#applySource();
    if (name === "html") this.#resetSource();
    this.#root.querySelectorAll<HTMLElement>("[data-tab]").forEach((tab) => {
      tab.setAttribute("aria-selected", String(tab.dataset.tab === name));
    });
    this.#root.querySelectorAll<HTMLElement>("[data-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== name;
    });
    const sourceWorkspace =
      this.#root.querySelector<HTMLElement>("[data-source-workspace]");
    const pageWrap = this.#root.querySelector<HTMLElement>(".scribeva__page-wrap");
    if (sourceWorkspace) sourceWorkspace.hidden = name !== "html";
    if (pageWrap) pageWrap.hidden = name === "html";
    this.#root.classList.toggle("is-source-mode", name === "html");
    if (name === "html") queueMicrotask(() => this.#source.focus());
  }

  #handleCommand(command: string): void {
    if (command.startsWith("align:")) {
      this.exec("align", command.split(":")[1]);
    } else if (command.startsWith("dialog:")) {
      this.#openDialog(command.split(":")[1] as DialogKind);
    } else if (command === "view:focus") {
      this.#root.classList.toggle("is-focus-mode");
    } else if (command === "view:print") {
      window.print();
    } else if (command === "imageUpload") {
      this.#root.querySelector<HTMLInputElement>("[data-image-upload]")?.click();
    } else if (command === "source:apply") {
      this.#applySource();
    } else if (command === "source:reset") {
      this.#resetSource();
    } else if (command === "source:wrap") {
      const wrapped = this.#source.wrap === "soft";
      this.#source.wrap = wrapped ? "off" : "soft";
      this.#root.classList.toggle("is-source-wrapped", !wrapped);
    } else {
      this.exec(command);
    }
  }

  #resetSource(): void {
    this.#source.value = this.#engine.getHTML();
    this.#updateSourceMetrics();
  }

  #applySource(): void {
    this.#engine.setHTML(this.#source.value, "command");
    this.#source.value = this.#engine.getHTML();
    this.#updateSourceMetrics();
    this.#updateStatus();
  }

  #updateSourceMetrics(): void {
    const value = this.#source.value;
    const lines = value.split("\n");
    this.#sourceLines.textContent = lines
      .map((_, index) => String(index + 1))
      .join("\n");
    const beforeCaret = value.slice(0, this.#source.selectionStart);
    const caretLines = beforeCaret.split("\n");
    const line = caretLines.length;
    const column = Array.from(caretLines.at(-1) ?? "").length + 1;
    this.#sourcePosition.textContent =
      `${this.#locale.chrome.line} ${line} · ${this.#locale.chrome.column} ${column} · ${lines.length} ${this.#locale.chrome.lines}`;
  }

  #captureSelection(): void {
    const selection = window.getSelection();
    if (
      selection &&
      selection.rangeCount &&
      this.#content.contains(selection.anchorNode)
    ) {
      this.#savedRange = selection.getRangeAt(0).cloneRange();
    }
  }

  #restoreSelection(): void {
    if (!this.#savedRange) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(this.#savedRange);
  }

  #openDialog(kind: DialogKind): void {
    this.#captureSelection();
    const l = this.#locale.dialog;
    const title = this.#dialog.querySelector<HTMLElement>("#scribeva-dialog-title");
    const fields = this.#dialog.querySelector<HTMLElement>("[data-dialog-fields]");
    const iconContainer =
      this.#dialog.querySelector<HTMLElement>(".scribeva__dialog-icon");
    if (!title || !fields || !iconContainer) return;
    this.#dialog.dataset.kind = kind;
    this.#dialog.classList.toggle("is-preview", kind === "preview");
    iconContainer.innerHTML = icon(kind);

    if (kind === "link") {
      title.textContent = l.linkTitle;
      fields.innerHTML = `
        <label>${l.linkUrl}<input name="href" type="url" required placeholder="https://"></label>
        <label>${l.linkText}<input name="text" type="text" placeholder="Scribeva"></label>
        <label class="scribeva__check"><input name="newTab" type="checkbox" checked>${l.newTab}</label>`;
    } else if (kind === "image") {
      title.textContent = l.imageTitle;
      fields.innerHTML = `
        <label>${l.imageUrl}<input name="src" type="url" required placeholder="https://"></label>
        <label>${l.imageAlt}<input name="alt" type="text"></label>`;
    } else if (kind === "table") {
      title.textContent = l.tableTitle;
      fields.innerHTML = `
        <div class="scribeva__field-grid">
          <label>${l.rows}<input name="rows" type="number" min="1" max="12" value="3" required></label>
          <label>${l.columns}<input name="columns" type="number" min="1" max="12" value="3" required></label>
        </div>
        <label class="scribeva__check"><input name="header" type="checkbox" checked>${this.#locale.commands.tableHeaderRow}</label>`;
    } else if (kind === "emoji") {
      title.textContent = l.emojiTitle;
      fields.innerHTML = `<div class="scribeva__emoji-grid">${EMOJI.map(
        (emoji) =>
          `<button type="button" data-emoji="${emoji}" aria-label="${emoji}">${emoji}</button>`,
      ).join("")}</div>`;
    } else {
      title.textContent = l.previewTitle;
      fields.innerHTML = `<article class="scribeva__preview">${this.#engine.getHTML()}</article>`;
    }

    this.#dialog.showModal();
    queueMicrotask(() =>
      fields.querySelector<HTMLElement>("input,button")?.focus(),
    );
  }

  #submitDialog(): void {
    const form = this.#dialog.querySelector<HTMLFormElement>("[data-dialog-form]");
    if (!form) return;
    const data = new FormData(form);
    const kind = this.#dialog.dataset.kind as DialogKind;
    if (kind === "link") {
      this.exec("link", {
        href: String(data.get("href") ?? ""),
        text: String(data.get("text") ?? ""),
        newTab: data.get("newTab") === "on",
      });
    } else if (kind === "image") {
      this.exec("image", {
        src: String(data.get("src") ?? ""),
        alt: String(data.get("alt") ?? ""),
      });
    } else if (kind === "table") {
      this.exec("table", {
        rows: Number(data.get("rows")),
        columns: Number(data.get("columns")),
        header: data.get("header") === "on",
      });
    }
    form.reset();
  }

  #toggleTheme(): void {
    const current = this.#root.dataset.theme;
    this.#setTheme(current === "dark" ? "light" : "dark");
  }

  #setTheme(theme: string): void {
    this.#root.dataset.theme = theme;
    const select = this.#root.querySelector<HTMLSelectElement>("[data-theme-select]");
    if (select) select.value = theme;
  }

  #updateStatus(): void {
    const text = this.#content.textContent?.replace(/\u200b/g, "") ?? "";
    const characters = Array.from(text).length;
    const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
    const selection = window.getSelection();
    const block = selection?.anchorNode
      ? (selection.anchorNode.nodeType === Node.ELEMENT_NODE
          ? (selection.anchorNode as Element)
          : selection.anchorNode.parentElement
        )?.closest("p,h1,h2,h3,h4,h5,h6,blockquote,pre,li")
      : null;
    const blockName = block?.tagName.toUpperCase() ?? "BODY";
    this.#status.textContent = `${blockName}  ·  ${words} ${this.#locale.status.words}  ·  ${characters} ${this.#locale.status.characters}`;
    const undo = this.#root.querySelector<HTMLButtonElement>(
      '[data-command="undo"]',
    );
    const redo = this.#root.querySelector<HTMLButtonElement>(
      '[data-command="redo"]',
    );
    if (undo) undo.disabled = !this.#engine.canUndo;
    if (redo) redo.disabled = !this.#engine.canRedo;
  }

  #updateActiveTools(): void {
    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    const element =
      anchor?.nodeType === Node.ELEMENT_NODE
        ? (anchor as Element)
        : anchor?.parentElement;
    const selectors: Record<string, string> = {
      bold: "strong,b",
      italic: "em,i",
      underline: "u",
      strike: "s,del",
      inlineCode: "code",
      bulletList: "ul",
      orderedList: "ol",
    };
    Object.entries(selectors).forEach(([command, selector]) => {
      const button = this.#root.querySelector<HTMLElement>(
        `[data-command="${command}"]`,
      );
      button?.classList.toggle("is-active", Boolean(element?.closest(selector)));
    });
  }
}
