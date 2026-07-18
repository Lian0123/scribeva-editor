import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditorEngine } from "../src/browser/editor-engine";

function placeCaret(root: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

describe("EditorEngine browser behavior", () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<article id="editor"></article>';
    root = document.querySelector("#editor")!;
  });

  it("handles keyboard and beforeinput history controls", () => {
    const engine = new EditorEngine(root, "<p>One</p>");
    root.innerHTML = "<p>Two</p>";
    root.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    expect(engine.getHTML()).toBe("<p>Two</p>");

    root.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        metaKey: true,
        code: "KeyZ",
        key: "z",
      }),
    );
    expect(engine.getHTML()).toBe("<p>One</p>");

    root.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        shiftKey: true,
        code: "KeyZ",
        key: "Z",
      }),
    );
    expect(engine.getHTML()).toBe("<p>Two</p>");

    const undo = new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "historyUndo",
    });
    root.dispatchEvent(undo);
    expect(undo.defaultPrevented).toBe(true);
    expect(engine.getHTML()).toBe("<p>One</p>");
  });

  it("commits once after composition ends", () => {
    const engine = new EditorEngine(root, "<p></p>");
    const listener = vi.fn();
    engine.onChange(listener);

    root.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    root.innerHTML = "<p>日本語</p>";
    root.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(listener).not.toHaveBeenCalled();
    root.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(engine.getHTML()).toBe("<p>日本語</p>");
  });

  it("normalizes HTML and plain-text paste", () => {
    const engine = new EditorEngine(root, "<p>Start</p>");
    placeCaret(root);
    const htmlPaste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(htmlPaste, "clipboardData", {
      value: {
        getData: (type: string) =>
          type === "text/html"
            ? '<p class="MsoNormal" onclick="x()">Office</p>'
            : "",
      },
    });
    root.dispatchEvent(htmlPaste);
    expect(engine.getHTML()).toContain("<p>Office</p>");
    expect(engine.getHTML()).not.toContain("onclick");

    engine.setHTML("<p>Start</p>");
    placeCaret(root);
    const textPaste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(textPaste, "clipboardData", {
      value: {
        getData: (type: string) => (type === "text/plain" ? "One\nTwo" : ""),
      },
    });
    root.dispatchEvent(textPaste);
    expect(engine.getHTML()).toContain("One<br>Two");
  });

  it("supports JSON, read-only state, plugins, and cleanup", () => {
    const onCreate = vi.fn();
    const onDestroy = vi.fn();
    const engine = new EditorEngine(root, "<p>One</p>", [
      {
        name: "test",
        commands: { hello: ({ setHTML }) => setHTML("<p>Hello</p>") },
        onCreate,
        onDestroy,
      },
    ]);
    expect(onCreate).toHaveBeenCalled();
    expect(engine.exec("hello")).toBe(true);
    expect(engine.getJSON().content[0]?.type).toBe("paragraph");

    engine.setJSON({
      type: "doc",
      content: [{ type: "heading1", content: [{ type: "text", text: "Title" }] }],
    });
    expect(engine.getHTML()).toBe("<h1>Title</h1>");

    engine.setReadOnly(true);
    expect(root.contentEditable).toBe("false");
    engine.destroy();
    engine.destroy();
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });
});
