export type EditorTheme = "light" | "dark" | "system";
export type EditorLocale = "zh-TW" | "en" | "ja" | (string & {});

export interface ScribevaMark {
  type:
    | "bold"
    | "italic"
    | "underline"
    | "strike"
    | "code"
    | "link"
    | "textStyle";
  attrs?: Record<string, string>;
}

export interface ScribevaNode {
  type: string;
  attrs?: Record<string, string>;
  content?: ScribevaNode[];
  marks?: ScribevaMark[];
  text?: string;
}

export interface ScribevaDocument extends ScribevaNode {
  type: "doc";
  content: ScribevaNode[];
}

export interface EditorChange {
  html: string;
  json: ScribevaDocument;
  source: "api" | "input" | "command" | "history" | "paste";
}

export interface EditorTransaction {
  html: string;
  source?: EditorChange["source"];
  addToHistory?: boolean;
}

export type EditorCommand = (
  editor: EditorCommandContext,
  value?: unknown,
) => boolean | void;

export interface EditorCommandContext {
  readonly element: HTMLElement;
  getHTML(): string;
  setHTML(html: string, source?: EditorChange["source"]): void;
  commit(source?: EditorChange["source"]): void;
  focus(): void;
}

export interface EditorPlugin {
  name: string;
  commands?: Record<string, EditorCommand>;
  onCreate?(context: EditorCommandContext): void;
  onDestroy?(): void;
}

export interface EditorOptions {
  initialHTML?: string;
  initialJSON?: ScribevaDocument;
  locale?: EditorLocale;
  theme?: EditorTheme;
  placeholder?: string;
  readOnly?: boolean;
  autofocus?: boolean;
  ariaLabel?: string;
  minHeight?: string;
  className?: string;
  plugins?: EditorPlugin[];
  onChange?: (change: EditorChange) => void;
}

export interface ScribevaEditor {
  getHTML(): string;
  setHTML(html: string): void;
  getJSON(): ScribevaDocument;
  setJSON(document: ScribevaDocument): void;
  focus(): void;
  destroy(): void;
  setReadOnly(readOnly: boolean): void;
  insertImageBlob(blob: Blob, alt?: string): string;
  exec(command: string, value?: unknown): boolean;
  registerCommand(name: string, command: EditorCommand): () => void;
  on(event: "change", listener: (change: EditorChange) => void): () => void;
}
