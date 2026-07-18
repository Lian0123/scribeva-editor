import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createEditor,
  defineScribevaElement,
  getLocale,
  registerLocale,
} from "../src/public-api";

function placeCaretAtEnd(element: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  element.focus();
}

describe("Scribeva public editor API", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value() {
        this.setAttribute("open", "");
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value(returnValue = "") {
        this.returnValue = returnValue;
        this.removeAttribute("open");
        this.dispatchEvent(new Event("close"));
      },
    });
  });

  it("mounts a full editor shell and exposes HTML/JSON APIs", () => {
    const host = document.querySelector<HTMLElement>("#host")!;
    const editor = createEditor(host, {
      initialHTML: "<p>Hello</p>",
      locale: "en",
    });

    expect(host.querySelector(".scribeva__ribbon")).not.toBeNull();
    expect(host.querySelector('[data-scribeva-content]')?.innerHTML).toBe(
      "<p>Hello</p>",
    );
    expect(editor.getJSON().type).toBe("doc");

    editor.setHTML('<h2 onclick="x()">Updated</h2>');
    expect(editor.getHTML()).toBe("<h2>Updated</h2>");
  });

  it("publishes change events and cleans up on destroy", () => {
    const host = document.querySelector<HTMLElement>("#host")!;
    const editor = createEditor(host, { initialHTML: "<p>One</p>" });
    const listener = vi.fn();
    editor.on("change", listener);

    editor.setHTML("<p>Two</p>");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ html: "<p>Two</p>", source: "api" }),
    );

    editor.destroy();
    expect(host.children).toHaveLength(0);
  });

  it("supports registered commands", () => {
    const host = document.querySelector<HTMLElement>("#host")!;
    const editor = createEditor(host, { initialHTML: "<p>One</p>" });
    editor.registerCommand("replace", (context, value) => {
      context.setHTML(`<p>${String(value)}</p>`, "command");
      return true;
    });

    expect(editor.exec("replace", "Custom")).toBe(true);
    expect(editor.getHTML()).toBe("<p>Custom</p>");
  });

  it("cancels required dialogs without validation blocking", () => {
    const host = document.querySelector<HTMLElement>("#host")!;
    createEditor(host, { initialHTML: "<p>One</p>" });
    const content = host.querySelector<HTMLElement>("[data-scribeva-content]")!;
    placeCaretAtEnd(content);

    host
      .querySelector<HTMLButtonElement>('[data-command="dialog:link"]')
      ?.click();
    const dialog = host.querySelector<HTMLDialogElement>("dialog")!;
    expect(dialog.open).toBe(true);
    expect(dialog.querySelector("input[required]")).not.toBeNull();

    dialog.querySelector<HTMLButtonElement>("[data-dialog-cancel]")?.click();
    expect(dialog.open).toBe(false);
  });

  it("inserts emoji and opens a sanitized preview", () => {
    const host = document.querySelector<HTMLElement>("#host")!;
    const editor = createEditor(host, { initialHTML: "<p>One</p>" });
    const content = host.querySelector<HTMLElement>("[data-scribeva-content]")!;
    placeCaretAtEnd(content);

    host
      .querySelector<HTMLButtonElement>('[data-command="dialog:emoji"]')
      ?.click();
    host.querySelector<HTMLButtonElement>('[data-emoji="😀"]')?.click();
    expect(editor.getHTML()).toContain("😀");

    host
      .querySelector<HTMLButtonElement>('[data-command="dialog:preview"]')
      ?.click();
    expect(host.querySelector(".scribeva__preview")?.textContent).toContain(
      "One",
    );
  });

  it("edits sanitized HTML source with line numbers and keyboard controls", () => {
    const host = document.querySelector<HTMLElement>("#host")!;
    const editor = createEditor(host, {
      initialHTML: "<h2>Source</h2>\n<p>Safe</p>",
      locale: "en",
    });
    host.querySelector<HTMLButtonElement>('[data-tab="html"]')?.click();

    const source =
      host.querySelector<HTMLTextAreaElement>("[data-scribeva-source]")!;
    expect(source.value).toContain("<h2>Source</h2>");
    expect(host.querySelector("[data-source-lines]")?.textContent).toBe("1\n2");

    source.value = '<h2 onclick="alert(1)">Edited</h2>\n<script>bad()</script><p>Safe</p>';
    source.dispatchEvent(new Event("input", { bubbles: true }));
    expect(host.querySelector("[data-source-lines]")?.textContent).toBe("1\n2");

    source.setSelectionRange(source.value.length, source.value.length);
    source.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(source.value.endsWith("  ")).toBe(true);
    source.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );

    source.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(editor.getHTML()).toBe("<h2>Edited</h2>\n<p>Safe</p>");

    host.querySelector<HTMLButtonElement>('[data-command="source:reset"]')?.click();
    expect(source.value).toBe("<h2>Edited</h2>\n<p>Safe</p>");
  });

  it("creates and revokes Blob image URLs", () => {
    const createObjectURL = vi.fn(() => "blob:scribeva-test");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });

    const host = document.querySelector<HTMLElement>("#host")!;
    const editor = createEditor(host, { initialHTML: "<p>One</p>" });
    const content = host.querySelector<HTMLElement>("[data-scribeva-content]")!;
    placeCaretAtEnd(content);

    expect(
      editor.insertImageBlob(new Blob(["image"], { type: "image/png" }), "Alt"),
    ).toBe("blob:scribeva-test");
    expect(editor.getHTML()).toContain('src="blob:scribeva-test"');
    expect(() =>
      editor.insertImageBlob(new Blob(["text"], { type: "text/plain" })),
    ).toThrow(TypeError);

    editor.destroy();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:scribeva-test");
  });

  it("registers Japanese and custom locales", () => {
    expect(getLocale("ja").tabs.home).toBe("ホーム");
    const custom = structuredClone(getLocale("en"));
    registerLocale("custom", {
      ...custom,
      tabs: { ...custom.tabs, home: "Custom" },
    });
    expect(getLocale("custom").tabs.home).toBe("Custom");
  });

  it("registers an optional custom element", () => {
    const tag = "scribeva-test-editor";
    const elementClass = defineScribevaElement(tag);
    expect(elementClass).toBeDefined();
    expect(defineScribevaElement(tag)).toBe(elementClass);

    const element = document.createElement(tag);
    element.innerHTML = "<p>Custom element</p>";
    document.body.append(element);
    expect(
      (element as HTMLElement & { editor?: unknown }).editor,
    ).toBeDefined();
    element.remove();
  });
});
