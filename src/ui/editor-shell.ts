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

type DialogKind =
  | "link"
  | "image"
  | "table"
  | "emoji"
  | "symbol"
  | "preview";

type TemplateId =
  | "executive"
  | "proposal"
  | "newsletter"
  | "meeting"
  | "manifesto"
  | "launch"
  | "caseStudy"
  | "workshop"
  | "adConcept";

interface DocumentTemplate {
  id: TemplateId;
  title: string;
  description: string;
  html: string;
}

const EMOJI = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😂",
  "🤣",
  "🥹",
  "🥰",
  "😍",
  "🤩",
  "😊",
  "😌",
  "😉",
  "🙃",
  "😎",
  "🤓",
  "🧐",
  "🤔",
  "🤗",
  "🤭",
  "🫢",
  "🫡",
  "🥳",
  "😴",
  "😭",
  "😤",
  "😱",
  "🙏",
  "👏",
  "🙌",
  "🤝",
  "💪",
  "👍",
  "👎",
  "👌",
  "✌️",
  "🤞",
  "🫶",
  "👀",
  "🎉",
  "🎊",
  "🎯",
  "🏆",
  "✨",
  "⭐",
  "🔥",
  "💯",
  "💡",
  "✅",
  "❌",
  "⚠️",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "💬",
  "📌",
  "📎",
  "📅",
  "📊",
  "📈",
  "📚",
  "🚀",
  "🌟",
  "🌈",
  "🌱",
  "🌏",
  "☀️",
  "🌙",
  "📝",
  "🔍",
  "🔒",
  "🔓",
  "⚙️",
  "🧩",
  "🎨",
  "💻",
];

const MATH_SYMBOLS = [
  "+",
  "−",
  "×",
  "÷",
  "±",
  "∓",
  "=",
  "≠",
  "≈",
  "≡",
  "<",
  ">",
  "≤",
  "≥",
  "∞",
  "√",
  "∛",
  "∑",
  "∏",
  "∫",
  "∬",
  "∂",
  "∇",
  "∆",
  "π",
  "α",
  "β",
  "γ",
  "δ",
  "θ",
  "λ",
  "μ",
  "σ",
  "φ",
  "ω",
  "∈",
  "∉",
  "⊂",
  "⊆",
  "∪",
  "∩",
  "∧",
  "∨",
  "¬",
  "⇒",
  "⇔",
  "∴",
  "∵",
  "°",
  "‰",
];

function escapeMarkup(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function characterButton(
  character: string,
  kind: "emoji" | "symbol",
): string {
  const safeCharacter = escapeMarkup(character);
  return `<button type="button" data-insert-character="${safeCharacter}" data-${kind}="${safeCharacter}" aria-label="${safeCharacter}">${safeCharacter}</button>`;
}

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
  readonly #tableSortState = new WeakMap<
    HTMLTableElement,
    { column: number; direction: "ascending" | "descending" }
  >();
  #draggedColumn: {
    table: HTMLTableElement;
    from: number;
    to?: number;
  } | null = null;
  #pointerColumnDrag: { table: HTMLTableElement; from: number } | null = null;
  #selectedTemplate: TemplateId = "executive";
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
    this.#setTheme(options.theme ?? "light");

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
      this.#refreshTableInteractions();
      this.#updateStatus();
      options.onChange?.(change);
    });

    this.#bindUI();
    this.#refreshTableInteractions();
    this.#updateStatus();
    if (options.autofocus) queueMicrotask(() => this.focus());
  }

  getHTML(): string {
    return this.#engine.getHTML();
  }

  setHTML(html: string): void {
    this.#engine.setHTML(html);
    this.#refreshTableInteractions();
    this.#updateStatus();
  }

  getJSON(): ScribevaDocument {
    return this.#engine.getJSON();
  }

  setJSON(document: ScribevaDocument): void {
    this.#engine.setJSON(document);
    this.#refreshTableInteractions();
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
    this.#refreshTableInteractions();
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

      <div class="scribeva__toolbar" data-scribeva-toolbar>
      <nav class="scribeva__tabs" role="tablist" aria-label="${l.chrome.editorTools}">
        <button role="tab" aria-selected="true" data-tab="home">${l.tabs.home}</button>
        <button role="tab" aria-selected="false" data-tab="insert">${l.tabs.insert}</button>
        <button role="tab" aria-selected="false" data-tab="templates">${l.tabs.templates}</button>
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
      <div class="scribeva__ribbon scribeva__ribbon--templates" data-panel="templates" hidden>
        ${this.#templateGroup()}
      </div>
      <div class="scribeva__ribbon" data-panel="view" hidden>
        ${this.#viewGroup()}
      </div>
      <div class="scribeva__ribbon scribeva__ribbon--source" data-panel="html" hidden>
        ${this.#sourceGroup()}
      </div>
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
        <div class="scribeva__zoom-control" role="group" aria-label="${l.status.zoom}">
          <span>${l.status.zoom}</span>
          <button type="button" data-zoom-step="-10" aria-label="${l.chrome.zoomOut}">−</button>
          <input type="range" min="70" max="140" value="100" step="10" data-zoom aria-label="${l.status.zoom}">
          <button type="button" data-zoom-step="10" aria-label="${l.chrome.zoomIn}">＋</button>
          <button type="button" class="scribeva__zoom-reset" data-zoom-reset aria-label="${l.chrome.resetZoom}">
            <output data-zoom-output>100%</output>
          </button>
        </div>
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
    return `<button class="scribeva__tool" data-command="${command}" title="${label}" aria-label="${label}">
      ${iconName ? icon(iconName) : `<span class="scribeva__tool-text">${text ?? label}</span>`}
      <small>${label}</small>
    </button>`;
  }

  #valueControl(
    command: string,
    label: string,
    presets: readonly number[],
    options: {
      defaultValue: number;
      min: number;
      max: number;
      step: number;
      unit?: string;
    },
  ): string {
    const { defaultValue, min, max, step, unit } = options;
    const l = this.#locale;
    return `<span class="scribeva__value-control" role="group" aria-label="${label}">
      <select data-value-preset="${command}" aria-label="${label} · ${l.chrome.presets}">
        ${presets
          .map(
            (value) =>
              `<option value="${value}"${value === defaultValue ? " selected" : ""}>${value}${unit ? ` ${unit}` : ""}</option>`,
          )
          .join("")}
        <option value="">${l.chrome.customValue}</option>
      </select>
      <label class="scribeva__value-entry" hidden>
        <span class="scribeva__sr-only">${label} · ${l.chrome.customValue}</span>
        <input class="scribeva__command-value" type="number" min="${min}" max="${max}" step="${step}" value="${defaultValue}"
          data-command-value="${command}" aria-label="${label} · ${l.chrome.customValue}">
        ${unit ? `<span aria-hidden="true">${unit}</span>` : ""}
      </label>
    </span>`;
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
        ${this.#valueControl("fontSize", l.chrome.fontSize, [12, 14, 16, 18, 20, 24, 32, 40], {
          defaultValue: 16,
          min: 6,
          max: 512,
          step: 0.5,
          unit: "px",
        })}
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
        ${this.#valueControl("lineHeight", l.chrome.lineHeight, [1, 1.2, 1.5, 1.75, 2, 2.5, 3], {
          defaultValue: 1.5,
          min: 0.5,
          max: 5,
          step: 0.05,
        })}
        <select data-command-select="columns" aria-label="${l.commands.columns}">
          <option value="1">${l.commands.oneColumn}</option>
          <option value="2">${l.commands.twoColumns}</option>
          <option value="3">${l.commands.threeColumns}</option>
          <option value="4">${l.commands.fourColumns}</option>
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
        ${this.#button("dialog:symbol", l.commands.symbol, undefined, "∑")}
        ${this.#button("horizontalRule", l.commands.horizontalRule, "divider")}
        ${this.#button("pageBreak", l.commands.pageBreak, "pageBreak")}
      </div>
      <input type="file" accept="image/*" data-image-upload hidden>
      <h3>${l.groups.insert}</h3>
    </section>
    <section class="scribeva__group scribeva__group--table">
      <div class="scribeva__control-row scribeva__table-actions">
        <span class="scribeva__table-action-set" role="group" aria-label="${l.dialog.rows}">
          ${this.#button("tableAddRowBefore", l.commands.tableAddRowBefore, "tableRowAbove")}
          ${this.#button("tableAddRowAfter", l.commands.tableAddRowAfter, "tableRowBelow")}
          ${this.#button("tableDeleteRow", l.commands.tableDeleteRow, "tableRowDelete")}
        </span>
        <span class="scribeva__table-action-set" role="group" aria-label="${l.dialog.columns}">
          ${this.#button("tableAddColumnBefore", l.commands.tableAddColumnBefore, "tableColumnBefore")}
          ${this.#button("tableAddColumnAfter", l.commands.tableAddColumnAfter, "tableColumnAfter")}
          ${this.#button("tableDeleteColumn", l.commands.tableDeleteColumn, "tableColumnDelete")}
        </span>
      </div>
      <div class="scribeva__control-row scribeva__table-actions scribeva__table-structure-actions">
        <span class="scribeva__table-action-set" role="group" aria-label="${l.groups.table}">
          ${this.#button("tableHeaderRow", l.commands.tableHeaderRow, "tableHeader")}
          ${this.#button("tableMergeRight", l.commands.tableMergeRight, "tableMerge")}
          ${this.#button("tableSplitCell", l.commands.tableSplitCell, "tableSplit")}
          ${this.#button("tableToggleSortable", l.commands.tableSortable, "tableSort")}
          ${this.#button("tableDelete", l.commands.tableDelete, "tableDelete")}
        </span>
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
        ${this.#valueControl("tableBorderWidth", l.commands.tableBorderWidth, [0, 1, 2, 3, 4], {
          defaultValue: 1,
          min: 0,
          max: 8,
          step: 0.5,
          unit: "px",
        })}
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
    return `<section class="scribeva__group scribeva__view-group">
      <div class="scribeva__view-section">
        <span class="scribeva__view-section-title">${l.groups.document}</span>
        <div class="scribeva__view-primary-actions">
          ${this.#button("view:focus", l.commands.focusMode, "focus")}
          ${this.#button("dialog:preview", l.commands.preview, "preview")}
        </div>
        <small class="scribeva__view-hint">${l.chrome.documentViewHint}</small>
        <div class="scribeva__theme-picker" role="radiogroup" aria-label="${l.chrome.theme}">
          <span>${l.chrome.themeHint}</span>
          <div>
            <button type="button" class="scribeva__theme-card" data-theme-choice="light" aria-checked="true"><i class="scribeva__theme-card-swatch is-light"></i><b>${l.theme.light}</b></button>
            <button type="button" class="scribeva__theme-card" data-theme-choice="dark" aria-checked="false"><i class="scribeva__theme-card-swatch is-dark"></i><b>${l.theme.dark}</b></button>
            <button type="button" class="scribeva__theme-card" data-theme-choice="system" aria-checked="false"><i class="scribeva__theme-card-swatch is-system"></i><b>${l.theme.system}</b></button>
          </div>
          <label class="scribeva__accent-picker">
            <span>${l.chrome.accentColor}</span>
            <input type="color" data-accent-color value="#5b5bd6" aria-label="${l.chrome.accentValue}">
            <output data-accent-value>#5B5BD6</output>
            <button type="button" data-accent-preset="#5b5bd6" aria-label="Indigo"></button>
            <button type="button" data-accent-preset="#df5b3f" aria-label="Coral"></button>
            <button type="button" data-accent-preset="#2e8b68" aria-label="Forest"></button>
            <button type="button" data-accent-preset="#b47b23" aria-label="Amber"></button>
          </label>
          <select data-theme-select aria-label="${l.chrome.theme}" hidden>
            <option value="light">${l.theme.light}</option>
            <option value="dark">${l.theme.dark}</option>
            <option value="system">${l.theme.system}</option>
          </select>
        </div>
      </div>
      <div class="scribeva__view-section scribeva__view-section--scroll">
        <span class="scribeva__view-section-title">${l.chrome.keepToolbarVisible}</span>
        <label class="scribeva__view-option scribeva__sticky-option">
          <input type="checkbox" data-sticky-toolbar>
          <span>${l.chrome.keepToolbarVisible}</span>
        </label>
        <label class="scribeva__view-option">
          <span>${l.chrome.stickyTopOffset}</span>
          <span class="scribeva__unit-input"><input type="number" min="0" max="240" step="1" value="0" data-sticky-offset="top"><b>px</b></span>
        </label>
        <label class="scribeva__view-option">
          <span>${l.chrome.stickyBottomOffset}</span>
          <span class="scribeva__unit-input"><input type="number" min="0" max="320" step="1" value="0" data-sticky-offset="bottom"><b>px</b></span>
        </label>
      </div>
      <div class="scribeva__view-section scribeva__view-section--output">
        <span class="scribeva__view-section-title">${l.commands.print}</span>
        <label class="scribeva__view-option scribeva__page-break-option">
          <input type="checkbox" data-show-page-breaks checked>
          <span>${l.chrome.showPageBreaks}</span>
        </label>
        <div class="scribeva__print-action">
          ${this.#button("view:print", l.commands.print, "print")}
          <small class="scribeva__print-note">${l.chrome.printDocumentOnly}</small>
        </div>
      </div>
      <h3>${l.groups.appearance}</h3>
    </section>`;
  }

  #templates(): DocumentTemplate[] {
    const copy = this.#locale.templates;
    const labels = Object.fromEntries(
      Object.entries(copy.labels).map(([key, value]) => [key, escapeMarkup(value)]),
    ) as Record<keyof typeof copy.labels, string>;
    return [
      {
        id: "executive",
        ...copy.executive,
        html: `<h1>${escapeMarkup(copy.executive.title)}</h1><blockquote>${escapeMarkup(copy.executive.description)}</blockquote><hr><h2>${labels.keySignals}</h2><table><thead><tr><th>${labels.keySignals}</th><th>${labels.status}</th><th>${labels.owner}</th></tr></thead><tbody><tr><td>01</td><td>—</td><td>—</td></tr><tr><td>02</td><td>—</td><td>—</td></tr></tbody></table><h2>${labels.nextActions}</h2><ol><li>—</li><li>—</li></ol>`,
      },
      {
        id: "proposal",
        ...copy.proposal,
        html: `<h1>${escapeMarkup(copy.proposal.title)}</h1><blockquote>${escapeMarkup(copy.proposal.description)}</blockquote><hr><h2>${labels.goals}</h2><ul><li>01 —</li><li>02 —</li></ul><h2>${labels.deliveryPlan}</h2><table><thead><tr><th>${labels.actions}</th><th>${labels.date}</th><th>${labels.owner}</th></tr></thead><tbody><tr><td>01</td><td>—</td><td>—</td></tr><tr><td>02</td><td>—</td><td>—</td></tr></tbody></table>`,
      },
      {
        id: "newsletter",
        ...copy.newsletter,
        html: `<p><strong>01 · EDITION</strong></p><h1>${escapeMarkup(copy.newsletter.title)}</h1><blockquote>${escapeMarkup(copy.newsletter.description)}</blockquote><hr class="scribeva-page-break"><h2>${labels.leadStory}</h2><p>—</p><h2>${labels.inBrief}</h2><ul><li>01 —</li><li>02 —</li><li>03 —</li></ul>`,
      },
      {
        id: "meeting",
        ...copy.meeting,
        html: `<h1>${escapeMarkup(copy.meeting.title)}</h1><p>${escapeMarkup(copy.meeting.description)}</p><table><tbody><tr><th>${labels.date}</th><td>YYYY-MM-DD</td></tr><tr><th>${labels.participants}</th><td>—</td></tr><tr><th>${labels.purpose}</th><td>—</td></tr></tbody></table><h2>${labels.agenda}</h2><ol><li>01 —</li><li>02 —</li><li>03 —</li></ol><h2>${labels.actions}</h2><table><thead><tr><th>${labels.actions}</th><th>${labels.owner}</th><th>${labels.date}</th></tr></thead><tbody><tr><td>—</td><td>—</td><td>—</td></tr></tbody></table>`,
      },
      {
        id: "manifesto",
        ...copy.manifesto,
        html: `<p><strong>01 / MANIFESTO</strong></p><h1>${escapeMarkup(copy.manifesto.title)}</h1><blockquote>${escapeMarkup(copy.manifesto.description)}</blockquote><hr><div class="scribeva-columns" style="column-count: 2; column-gap: 32px"><h2>${labels.keySignals}</h2><p>01 —</p><p>02 —</p><p>03 —</p><h2>${labels.nextActions}</h2><p>04 —</p><p>05 —</p><p>06 —</p></div>`,
      },
      {
        id: "launch",
        ...copy.launch,
        html: `<p><strong>LAUNCH / 00:00</strong></p><h1>${escapeMarkup(copy.launch.title)}</h1><blockquote>${escapeMarkup(copy.launch.description)}</blockquote><h2>${labels.deliveryPlan}</h2><table><thead><tr><th>${labels.actions}</th><th>${labels.status}</th><th>${labels.owner}</th></tr></thead><tbody><tr><td>01</td><td>READY</td><td>—</td></tr><tr><td>02</td><td>HOLD</td><td>—</td></tr><tr><td>03</td><td>GO</td><td>—</td></tr></tbody></table><hr class="scribeva-page-break"><h2>${labels.keySignals}</h2><ul><li>01 —</li><li>02 —</li><li>03 —</li></ul>`,
      },
      {
        id: "caseStudy",
        ...copy.caseStudy,
        html: `<p><strong>CASE / 001</strong></p><h1>${escapeMarkup(copy.caseStudy.title)}</h1><blockquote>${escapeMarkup(copy.caseStudy.description)}</blockquote><h2>${labels.purpose}</h2><p>—</p><h2>${labels.keySignals}</h2><table><tbody><tr><th>01</th><td>—</td></tr><tr><th>02</th><td>—</td></tr><tr><th>03</th><td>—</td></tr></tbody></table><h2>${labels.nextActions}</h2><p>—</p>`,
      },
      {
        id: "workshop",
        ...copy.workshop,
        html: `<h1>${escapeMarkup(copy.workshop.title)}</h1><blockquote>${escapeMarkup(copy.workshop.description)}</blockquote><table><tbody><tr><th>${labels.date}</th><td>—</td></tr><tr><th>${labels.participants}</th><td>—</td></tr><tr><th>${labels.purpose}</th><td>—</td></tr></tbody></table><h2>${labels.agenda}</h2><ol><li>01 —</li><li>02 —</li><li>03 —</li></ol><hr class="scribeva-page-break"><h2>${labels.actions}</h2><table><thead><tr><th>${labels.actions}</th><th>${labels.owner}</th></tr></thead><tbody><tr><td>—</td><td>—</td></tr></tbody></table>`,
      },
      {
        id: "adConcept",
        ...copy.adConcept,
        html: `<p><strong>01 / 001</strong></p><h1>${escapeMarkup(copy.adConcept.title)}</h1><blockquote>${escapeMarkup(copy.adConcept.description)}</blockquote><hr><h2>${labels.insight}</h2><p>—</p><h2>${labels.headline}</h2><p><strong>—</strong></p><h2>${labels.keyVisual}</h2><table><tbody><tr><th>${labels.scene}</th><td>—</td></tr><tr><th>${labels.mood}</th><td>—</td></tr><tr><th>${labels.voice}</th><td>—</td></tr></tbody></table><h2>${labels.cta}</h2><p>—</p>`,
      },
    ];
  }

  #templateGroup(): string {
    const l = this.#locale;
    const templates = this.#templates();
    const selected = templates[0]!;
    return `<section class="scribeva__group scribeva__template-group">
      <div class="scribeva__template-gallery" role="group" aria-label="${l.groups.templates}">
        ${templates
          .map(
            (template, index) => `<button type="button" class="scribeva__template-card${index === 0 ? " is-selected" : ""}" data-template-id="${template.id}" aria-pressed="${index === 0}">
              <span class="scribeva__template-card-sheet" aria-hidden="true"><i></i><i></i><i></i></span>
              <strong>${template.title}</strong><small>${template.description}</small>
            </button>`,
          )
          .join("")}
      </div>
      <div class="scribeva__template-preview-panel">
        <span>${l.chrome.templatePreview}</span>
        <article data-template-preview>${selected.html}</article>
      </div>
      <div class="scribeva__template-apply">
        <button type="button" class="scribeva__button scribeva__button--primary" data-apply-template>${l.commands.applyTemplate}</button>
        <small>${l.chrome.templateReplaceHint}</small>
      </div>
      <h3>${l.groups.templates}</h3>
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
        const control = (event.target as Element).closest(
          "[data-command],[data-command-select],[data-command-value],[data-value-preset],[data-command-input],[data-block-select],[data-table-borders]",
        );
        if (control) {
          this.#captureSelection();
          if (control.matches("[data-command]")) event.preventDefault();
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

        const templateCard = target.closest<HTMLButtonElement>("[data-template-id]");
        if (templateCard?.dataset.templateId) {
          this.#selectTemplate(templateCard.dataset.templateId as TemplateId);
        }
        if (target.closest("[data-apply-template]")) this.#applyTemplate();

        if (target.closest('[data-action="theme"]')) this.#toggleTheme();
        const accentPreset = target.closest<HTMLButtonElement>("[data-accent-preset]");
        if (accentPreset?.dataset.accentPreset) {
          this.#setAccentColor(accentPreset.dataset.accentPreset);
        }
        const themeChoice = target.closest<HTMLButtonElement>("[data-theme-choice]");
        if (themeChoice?.dataset.themeChoice) {
          this.#setTheme(themeChoice.dataset.themeChoice);
        }
        if (target.closest("[data-dialog-cancel]")) this.#dialog.close("cancel");

        const characterButton = target.closest<HTMLButtonElement>(
          "[data-insert-character]",
        );
        if (characterButton?.dataset.insertCharacter) {
          this.#dialog.close("cancel");
          this.exec("insertText", characterButton.dataset.insertCharacter);
        }

        const sortableHeader = target.closest<HTMLTableCellElement>(
          'table[data-scribeva-sortable="true"] th',
        );
        if (
          sortableHeader &&
          (Boolean(sortableHeader.closest(".scribeva__preview")) ||
            this.#content.getAttribute("contenteditable") === "false")
        ) {
          event.preventDefault();
          this.#sortTable(sortableHeader);
        }
      },
      { signal },
    );

    this.#root.addEventListener(
      "change",
      (event) => {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        if (target.matches("[data-sticky-toolbar]")) {
          this.#root.classList.toggle(
            "is-toolbar-sticky",
            (target as HTMLInputElement).checked,
          );
        } else if (target.matches("[data-accent-color]")) {
          this.#setAccentColor((target as HTMLInputElement).value);
        } else if (target.matches("[data-sticky-offset]")) {
          const input = target as HTMLInputElement;
          const value = Math.min(
            Number(input.max),
            Math.max(Number(input.min), Number(input.value) || 0),
          );
          input.value = String(value);
          const property =
            input.dataset.stickyOffset === "bottom"
              ? "--scribeva-sticky-bottom"
              : "--scribeva-sticky-top";
          this.#root.style.setProperty(property, `${value}px`);
        } else if (target.matches("[data-show-page-breaks]")) {
          this.#root.classList.toggle(
            "hide-page-breaks",
            !(target as HTMLInputElement).checked,
          );
        } else if (target.matches("[data-image-upload]")) {
          const file = (target as HTMLInputElement).files?.[0];
          if (file) this.insertImageBlob(file, file.name);
          (target as HTMLInputElement).value = "";
        } else if (target.matches("[data-table-borders]")) {
          const color = this.#root.querySelector<HTMLInputElement>(
            '[data-command-input="tableBorderColor"]',
          )?.value;
          const width = this.#root.querySelector<HTMLInputElement>(
            '[data-command-value="tableBorderWidth"]',
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
        } else if (target.matches("[data-value-preset]")) {
          const command = target.dataset.valuePreset;
          if (!command) return;
          const input = this.#root.querySelector<HTMLInputElement>(
            `[data-command-value="${command}"]`,
          );
          const entry = input?.closest<HTMLElement>(".scribeva__value-entry");
          if (target.value === "") {
            if (entry) entry.hidden = false;
            input?.focus();
            input?.select();
            return;
          }
          if (input) input.value = target.value;
          if (entry) entry.hidden = true;
          this.exec(command, target.value);
        } else if (target.matches("[data-command-value]")) {
          const command = target.dataset.commandValue!;
          const preset = this.#root.querySelector<HTMLSelectElement>(
            `[data-value-preset="${command}"]`,
          );
          if (preset) {
            const isPreset = Array.from(preset.options).some(
              (option) => option.value === target.value,
            );
            preset.value = isPreset ? target.value : "";
            const entry = target.closest<HTMLElement>(
              ".scribeva__value-entry",
            );
            if (entry) entry.hidden = isPreset;
          }
          this.exec(command, target.value);
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

    this.#content.addEventListener(
      "pointerdown",
      (event) => {
        const header = (event.target as Element).closest<HTMLTableCellElement>(
          "th[draggable=true]",
        );
        const table = header?.closest("table");
        const row = header?.parentElement as HTMLTableRowElement | null;
        if (!header || !table || !row || event.button !== 0) return;
        const from = Array.from(row.cells).indexOf(header);
        if (from >= 0) this.#pointerColumnDrag = { table, from };
      },
      { signal },
    );
    this.#content.addEventListener(
      "pointerup",
      (event) => {
        const dragged = this.#pointerColumnDrag;
        this.#pointerColumnDrag = null;
        if (!dragged) return;
        const pointTarget = document.elementFromPoint(event.clientX, event.clientY);
        const eventElement = event.target instanceof Element ? event.target : null;
        const header = (pointTarget ?? eventElement)?.closest<HTMLTableCellElement>(
          "th",
        );
        const table = header?.closest("table");
        const row = header?.parentElement as HTMLTableRowElement | null;
        if (!header || !row || table !== dragged.table) return;
        const to = Array.from(row.cells).indexOf(header);
        if (to < 0 || to === dragged.from) return;
        this.#selectContents(header);
        this.#captureSelection();
        this.exec("tableMoveColumn", { from: dragged.from, to });
      },
      { signal },
    );
    this.#content.addEventListener(
      "pointercancel",
      () => {
        this.#pointerColumnDrag = null;
      },
      { signal },
    );
    this.#content.addEventListener(
      "dragstart",
      (event) => {
        const eventElement =
          event.target instanceof Element
            ? event.target
            : event.target instanceof Node
              ? event.target.parentElement
              : null;
        const header = eventElement?.closest<HTMLTableCellElement>(
          "th[draggable=true]",
        );
        const table = header?.closest("table");
        const row = header?.parentElement as HTMLTableRowElement | null;
        if (!header || !table || !row) return;
        const from = Array.from(row.cells).indexOf(header);
        if (from < 0) return;
        this.#draggedColumn = { table, from };
        event.dataTransfer?.setData("text/plain", String(from));
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        table.classList.add("is-column-dragging");
      },
      { signal },
    );
    this.#content.addEventListener(
      "dragover",
      (event) => {
        const eventElement =
          event.target instanceof Element
            ? event.target
            : event.target instanceof Node
              ? event.target.parentElement
              : null;
        const header = eventElement?.closest<HTMLTableCellElement>("th");
        if (!header || header.closest("table") !== this.#draggedColumn?.table) {
          return;
        }
        event.preventDefault();
        const row = header.parentElement as HTMLTableRowElement | null;
        const to = row ? Array.from(row.cells).indexOf(header) : -1;
        if (to >= 0 && this.#draggedColumn) this.#draggedColumn.to = to;
        this.#content
          .querySelectorAll("th.is-column-drop-target")
          .forEach((cell) => cell.classList.remove("is-column-drop-target"));
        header.classList.add("is-column-drop-target");
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      },
      { signal },
    );
    this.#content.addEventListener(
      "drop",
      (event) => {
        const eventElement =
          event.target instanceof Element
            ? event.target
            : event.target instanceof Node
              ? event.target.parentElement
              : null;
        const header = eventElement?.closest<HTMLTableCellElement>("th");
        const table = header?.closest("table");
        const row = header?.parentElement as HTMLTableRowElement | null;
        const dragged = this.#draggedColumn;
        if (!header || !table || !row || table !== dragged?.table) return;
        event.preventDefault();
        const to = Array.from(row.cells).indexOf(header);
        this.#selectContents(header);
        this.#captureSelection();
        this.#finishColumnDrag();
        this.#pointerColumnDrag = null;
        this.exec("tableMoveColumn", { from: dragged.from, to });
      },
      { signal },
    );
    this.#content.addEventListener(
      "dragend",
      () => {
        const dragged = this.#draggedColumn;
        const target =
          dragged?.to === undefined
            ? null
            : dragged.table.rows[0]?.cells[dragged.to] ?? null;
        this.#finishColumnDrag();
        this.#pointerColumnDrag = null;
        if (!dragged || dragged.to === undefined || dragged.to === dragged.from) {
          return;
        }
        if (target) {
          this.#selectContents(target);
          this.#captureSelection();
        }
        this.exec("tableMoveColumn", { from: dragged.from, to: dragged.to });
      },
      { signal },
    );

    this.#root.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const header = (event.target as Element).closest<HTMLTableCellElement>(
          'table[data-scribeva-sortable="true"] th[tabindex="0"]',
        );
        if (!header) return;
        event.preventDefault();
        this.#sortTable(header);
      },
      { signal },
    );

    const zoom = this.#root.querySelector<HTMLInputElement>("[data-zoom]");
    const updateZoom = (value: number): void => {
      if (!zoom || !Number.isFinite(value)) return;
      const minimum = Number(zoom.min);
      const maximum = Number(zoom.max);
      const percentage = Math.min(maximum, Math.max(minimum, value));
      zoom.value = String(percentage);
      const scale = percentage / 100;
      this.#root.style.setProperty("--scribeva-zoom", String(scale));
      const output = this.#root.querySelector<HTMLOutputElement>(
        "[data-zoom-output]",
      );
      if (output) output.value = `${percentage}%`;
    };

    zoom?.addEventListener(
      "input",
      () => {
        updateZoom(Number(zoom.value));
      },
      { signal },
    );
    this.#root
      .querySelectorAll<HTMLElement>("[data-zoom-step]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () =>
            updateZoom(
              Number(zoom?.value ?? 100) + Number(button.dataset.zoomStep),
            ),
          { signal },
        );
      });
    this.#root
      .querySelector<HTMLElement>("[data-zoom-reset]")
      ?.addEventListener("click", () => updateZoom(100), { signal });

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
      this.#printDocument();
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

  #selectTemplate(id: TemplateId): void {
    const template = this.#templates().find((candidate) => candidate.id === id);
    if (!template) return;
    this.#selectedTemplate = id;
    this.#root.querySelectorAll<HTMLButtonElement>("[data-template-id]").forEach(
      (card) => {
        const selected = card.dataset.templateId === id;
        card.classList.toggle("is-selected", selected);
        card.setAttribute("aria-pressed", String(selected));
      },
    );
    const preview = this.#root.querySelector<HTMLElement>("[data-template-preview]");
    if (preview) preview.innerHTML = template.html;
  }

  #applyTemplate(): void {
    const template = this.#templates().find(
      (candidate) => candidate.id === this.#selectedTemplate,
    );
    if (!template) return;
    this.#engine.setHTML(template.html, "command");
    this.#refreshTableInteractions();
    this.#updateStatus();
    this.#activateTab("home");
    this.focus();
  }

  #printDocument(): void {
    const printWindow = window.open("about:blank", "_blank");
    if (!printWindow) return;
    const themeStyles = getComputedStyle(this.#root);
    const printColor = (name: string, fallback: string): string =>
      themeStyles.getPropertyValue(name).trim() || fallback;
    const accent = printColor("--scribeva-accent", "#5b5bd6");
    const accentStrong = printColor("--scribeva-accent-strong", accent);
    const accentSoft = printColor("--scribeva-accent-soft", "#eeeeff");
    const surface = printColor("--scribeva-surface", "#ffffff");
    const background = printColor("--scribeva-bg", "#eef1f6");
    const text = printColor("--scribeva-text", "#172033");
    const muted = printColor("--scribeva-text-muted", "#697386");
    const border = printColor("--scribeva-border-strong", "#c5ccd8");
    printWindow.opener = null;
    const printDocument = printWindow.document;
    printDocument.title = this.#locale.chrome.printPreviewTitle;
    const meta = printDocument.createElement("meta");
    meta.setAttribute("charset", "utf-8");
    const viewport = printDocument.createElement("meta");
    viewport.name = "viewport";
    viewport.content = "width=device-width, initial-scale=1";
    const style = printDocument.createElement("style");
    style.textContent = `
      :root { color: ${text}; background: ${background}; font-family: system-ui, sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; }
      .print-toolbar { position: sticky; z-index: 2; top: 0; display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid ${border}; background: ${surface}; box-shadow: 0 4px 18px rgb(23 32 51 / 10%); }
      .print-toolbar strong { margin-right: auto; }
      .print-toolbar small { color: ${muted}; }
      button { min-height: 38px; padding: 0 16px; border: 1px solid ${accentStrong}; border-radius: 6px; background: ${accent}; color: white; font: inherit; cursor: pointer; }
      button.secondary { border-color: ${border}; background: ${surface}; color: ${text}; }
      main { width: min(816px, calc(100% - 32px)); min-height: 1056px; margin: 32px auto; padding: 72px 76px; background: ${surface}; box-shadow: 0 18px 45px rgb(27 39 65 / 14%); }
      h1 { font-size: 2.25em; line-height: 1.15; } h2 { margin-top: 1.6em; }
      p, li, td, th { line-height: 1.65; }
      blockquote { margin: 1.5em 0; padding: .25em 1em; border-left: 4px solid ${accent}; color: ${muted}; }
      table { width: 100%; border-collapse: collapse; } th, td { padding: 8px 10px; border: 1px solid ${border}; text-align: left; }
      img { max-width: 100%; height: auto; }
      .scribeva-columns { column-rule: 1px solid ${border}; }
      .scribeva-page-break { height: 14px; margin: 2.4em -24px; border: 0; border-top: 1px dashed ${border}; border-bottom: 1px dashed ${border}; background: ${accentSoft}; }
      @media print {
        :root { background: white; }
        .print-toolbar { display: none !important; }
        main { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; }
        .scribeva-page-break { display: block; height: 0; margin: 0; border: 0; break-after: page; }
      }
    `;
    printDocument.head.replaceChildren(meta, viewport, style);

    const toolbar = printDocument.createElement("header");
    toolbar.className = "print-toolbar";
    const heading = printDocument.createElement("strong");
    heading.textContent = this.#locale.chrome.printPreviewTitle;
    const hint = printDocument.createElement("small");
    hint.textContent = this.#locale.chrome.printReadyHint;
    const close = printDocument.createElement("button");
    close.type = "button";
    close.className = "secondary";
    close.textContent = this.#locale.commands.closePrint;
    close.addEventListener("click", () => printWindow.close());
    const print = printDocument.createElement("button");
    print.type = "button";
    print.textContent = this.#locale.commands.print;
    print.addEventListener("click", () => printWindow.print());
    toolbar.append(heading, hint, close, print);

    const documentContent = printDocument.createElement("main");
    documentContent.innerHTML = this.#engine.getHTML();
    printDocument.body.replaceChildren(toolbar, documentContent);
    printWindow.focus();
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

  #selectContents(node: Node): void {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
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
        (emoji) => characterButton(emoji, "emoji"),
      ).join("")}</div>
        <label>${l.customEmoji}<input name="character" type="text" maxlength="32" required autocomplete="off"></label>`;
    } else if (kind === "symbol") {
      title.textContent = l.symbolTitle;
      fields.innerHTML = `<div class="scribeva__emoji-grid scribeva__symbol-grid">${MATH_SYMBOLS.map(
        (symbol) => characterButton(symbol, "symbol"),
      ).join("")}</div>
        <label>${l.customSymbol}<input name="character" type="text" maxlength="32" required autocomplete="off"></label>`;
    } else {
      title.textContent = l.previewTitle;
      fields.innerHTML = `<article class="scribeva__preview">${this.#engine.getHTML()}</article>`;
      fields
        .querySelectorAll<HTMLTableCellElement>(
          'table[data-scribeva-sortable="true"] th',
        )
        .forEach((header) => {
          header.tabIndex = 0;
        });
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
    } else if (kind === "emoji" || kind === "symbol") {
      const character = String(data.get("character") ?? "").trim();
      if (character) this.exec("insertText", character);
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
    this.#root.querySelectorAll<HTMLButtonElement>("[data-theme-choice]").forEach(
      (button) => {
        button.setAttribute(
          "aria-checked",
          String(button.dataset.themeChoice === theme),
        );
      },
    );
    this.#syncAccentControl();
  }

  #setAccentColor(value: string): void {
    const normalized = value.trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/u.test(normalized)) return;
    this.#root.style.setProperty("--scribeva-accent", normalized);
    this.#root.style.setProperty(
      "--scribeva-accent-strong",
      `color-mix(in srgb, ${normalized} 78%, #000)`,
    );
    this.#root.style.setProperty(
      "--scribeva-accent-soft",
      `color-mix(in srgb, ${normalized} 13%, var(--scribeva-surface))`,
    );
    this.#root.style.setProperty("--scribeva-focus", normalized);
    this.#syncAccentControl(normalized);
  }

  #syncAccentControl(value?: string): void {
    const input = this.#root.querySelector<HTMLInputElement>("[data-accent-color]");
    const output = this.#root.querySelector<HTMLOutputElement>("[data-accent-value]");
    const computed = getComputedStyle(this.#root)
      .getPropertyValue("--scribeva-accent")
      .trim();
    const candidate = value ?? (computed.startsWith("#") ? computed : "#5b5bd6");
    if (input && /^#[0-9a-f]{6}$/u.test(candidate)) input.value = candidate;
    if (output) output.value = candidate.toUpperCase();
    this.#root.querySelectorAll<HTMLButtonElement>("[data-accent-preset]").forEach(
      (button) => {
        button.classList.toggle(
          "is-selected",
          button.dataset.accentPreset?.toLowerCase() === candidate.toLowerCase(),
        );
      },
    );
  }

  #refreshTableInteractions(): void {
    const editable = this.#content.getAttribute("contenteditable") === "true";
    this.#content.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
      const sortable = table.dataset.scribevaSortable === "true";
      table.querySelectorAll<HTMLTableCellElement>("th").forEach((header) => {
        header.draggable = editable && header.colSpan === 1;
        if (sortable && !editable) header.tabIndex = 0;
        else header.removeAttribute("tabindex");
      });
    });
  }

  #finishColumnDrag(): void {
    this.#draggedColumn?.table.classList.remove("is-column-dragging");
    this.#content
      .querySelectorAll("th.is-column-drop-target")
      .forEach((cell) => cell.classList.remove("is-column-drop-target"));
    this.#draggedColumn = null;
  }

  #sortTable(header: HTMLTableCellElement): void {
    const table = header.closest("table");
    const row = header.parentElement as HTMLTableRowElement | null;
    const body = table?.tBodies[0];
    if (!table || !row || !body) return;
    const column = Array.from(row.cells).indexOf(header);
    if (column < 0) return;
    const previous = this.#tableSortState.get(table);
    const direction =
      previous?.column === column && previous.direction === "ascending"
        ? "descending"
        : "ascending";
    const multiplier = direction === "ascending" ? 1 : -1;
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: "base",
    });
    const rows = Array.from(body.rows).map((bodyRow, index) => ({
      index,
      row: bodyRow,
      value: bodyRow.cells[column]?.textContent?.trim() ?? "",
    }));
    rows
      .sort(
        (a, b) =>
          multiplier * collator.compare(a.value, b.value) || a.index - b.index,
      )
      .forEach(({ row: bodyRow }) => body.append(bodyRow));
    table.querySelectorAll("th[aria-sort]").forEach((cell) => {
      cell.removeAttribute("aria-sort");
    });
    header.setAttribute("aria-sort", direction);
    this.#tableSortState.set(table, { column, direction });
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
    const table = element?.closest("table");
    const sortableButton = this.#root.querySelector<HTMLButtonElement>(
      '[data-command="tableToggleSortable"]',
    );
    const sortable = table?.getAttribute("data-scribeva-sortable") === "true";
    sortableButton?.classList.toggle("is-active", sortable);
    sortableButton?.setAttribute("aria-pressed", String(sortable));
  }
}
