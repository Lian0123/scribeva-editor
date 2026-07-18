import type {
  EditorChange,
  EditorTransaction,
  ScribevaDocument,
} from "./types";
import { htmlToJSON, jsonToHTML } from "../security/serializer";
import { sanitizeHTML } from "../security/sanitizer";

interface Snapshot {
  html: string;
  json: ScribevaDocument;
}

export class DocumentModel {
  readonly #historyLimit: number;
  readonly #listeners = new Set<(change: EditorChange) => void>();
  #snapshots: Snapshot[] = [];
  #historyIndex = -1;
  #current: Snapshot;

  constructor(initialHTML = "<p></p>", historyLimit = 100) {
    this.#historyLimit = historyLimit;
    this.#current = this.#createSnapshot(initialHTML);
    this.#pushHistory(this.#current);
  }

  get html(): string {
    return this.#current.html;
  }

  get json(): ScribevaDocument {
    return structuredClone(this.#current.json);
  }

  get canUndo(): boolean {
    return this.#historyIndex > 0;
  }

  get canRedo(): boolean {
    return this.#historyIndex < this.#snapshots.length - 1;
  }

  apply(transaction: EditorTransaction): boolean {
    const next = this.#createSnapshot(transaction.html);
    if (next.html === this.#current.html) return false;

    this.#current = next;
    if (transaction.addToHistory !== false) this.#pushHistory(next);
    this.#emit(transaction.source ?? "api");
    return true;
  }

  setJSON(
    document: ScribevaDocument,
    source: EditorChange["source"] = "api",
  ): boolean {
    return this.apply({ html: jsonToHTML(document), source });
  }

  checkpoint(): boolean {
    if (this.#snapshots[this.#historyIndex]?.html === this.#current.html) {
      return false;
    }
    this.#pushHistory(this.#current);
    return true;
  }

  undo(): boolean {
    if (this.#historyIndex <= 0) return false;
    this.#historyIndex -= 1;
    this.#current = this.#snapshots[this.#historyIndex]!;
    this.#emit("history");
    return true;
  }

  redo(): boolean {
    if (this.#historyIndex >= this.#snapshots.length - 1) return false;
    this.#historyIndex += 1;
    this.#current = this.#snapshots[this.#historyIndex]!;
    this.#emit("history");
    return true;
  }

  subscribe(listener: (change: EditorChange) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #createSnapshot(html: string): Snapshot {
    const sanitized = sanitizeHTML(html);
    return {
      html: sanitized || "<p></p>",
      json: htmlToJSON(sanitized || "<p></p>"),
    };
  }

  #pushHistory(snapshot: Snapshot): void {
    this.#snapshots = this.#snapshots.slice(0, this.#historyIndex + 1);
    this.#snapshots.push(snapshot);
    if (this.#snapshots.length > this.#historyLimit) this.#snapshots.shift();
    this.#historyIndex = this.#snapshots.length - 1;
  }

  #emit(source: EditorChange["source"]): void {
    const change: EditorChange = {
      html: this.html,
      json: this.json,
      source,
    };
    this.#listeners.forEach((listener) => listener(change));
  }
}
