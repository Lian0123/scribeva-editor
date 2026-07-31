import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditorEngine } from "../src/browser/editor-engine";

function selectText(
  root: HTMLElement,
  start = 0,
  end = root.textContent?.length ?? 0,
): void {
  const block = root.querySelector("p,h1,h2,h3,td,th,li");
  const walker = block
    ? document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
    : null;
  let text = walker?.nextNode() ?? null;
  while (text && (text.textContent?.length ?? 0) === 0) {
    text = walker?.nextNode() ?? null;
  }
  if (!text) throw new Error("No selectable text node.");
  const range = document.createRange();
  range.setStart(text, Math.min(start, text.textContent?.length ?? 0));
  range.setEnd(text, Math.min(end, text.textContent?.length ?? 0));
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

function selectCell(root: HTMLElement, row = 0, column = 0): void {
  const cell = root.querySelectorAll("tr")[row]?.children[column];
  if (!cell) throw new Error("No table cell.");
  const range = document.createRange();
  range.selectNodeContents(cell);
  range.collapse(true);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

describe("default editor commands", () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<article id="editor"></article>';
    root = document.querySelector("#editor")!;
  });

  it("applies and removes inline formatting", () => {
    const engine = new EditorEngine(root, "<p>Hello</p>");
    selectText(root, 0, 5);
    expect(engine.exec("bold")).toBe(true);
    expect(engine.getHTML()).toBe("<p><strong>Hello</strong></p>");

    selectText(root, 0, 5);
    expect(engine.exec("bold")).toBe(true);
    expect(engine.getHTML()).toBe("<p>Hello</p>");

    for (const [command, tag] of [
      ["italic", "em"],
      ["underline", "u"],
      ["strike", "s"],
      ["inlineCode", "code"],
    ] as const) {
      engine.setHTML("<p>Hello</p>");
      selectText(root, 0, 5);
      expect(engine.exec(command)).toBe(true);
      expect(engine.getHTML()).toContain(`<${tag}>Hello</${tag}>`);
    }
  });

  it("changes blocks, inline styles, alignment, and indentation", () => {
    const engine = new EditorEngine(root, "<p>Hello</p>");
    selectText(root, 0, 5);
    expect(engine.exec("heading2")).toBe(true);
    expect(engine.getHTML()).toBe("<h2>Hello</h2>");
    expect(engine.exec("heading2")).toBe(false);

    selectText(root, 0, 5);
    engine.exec("fontFamily", "'Noto Sans', sans-serif");
    expect(engine.getHTML()).toContain("font-family: 'Noto Sans', sans-serif");

    selectText(root, 0, 5);
    engine.exec("align", "center");
    expect(engine.getHTML()).toContain("text-align: center");
    engine.exec("indent");
    expect(engine.getHTML()).toContain("margin-left: 32px");
    engine.exec("outdent");
    expect(engine.getHTML()).toContain("margin-left: 0px");
  });

  it("accepts validated custom font sizes and line heights", () => {
    const engine = new EditorEngine(root, "<p>Hello</p>");

    selectText(root, 0, 5);
    expect(engine.exec("fontSize", "18.5")).toBe(true);
    expect(engine.getHTML()).toContain("font-size: 18.5px");

    engine.setHTML("<p>Hello</p>");
    selectText(root, 0, 5);
    expect(engine.exec("fontSize", "21pt")).toBe(true);
    expect(engine.getHTML()).toContain("font-size: 21pt");

    engine.setHTML("<p>Hello</p>");
    selectText(root, 0, 5);
    expect(engine.exec("lineHeight", "1.65")).toBe(true);
    expect(engine.getHTML()).toContain("line-height: 1.65");

    selectText(root, 0, 5);
    expect(engine.exec("fontSize", "calc(1px + 1vw)")).toBe(false);
    expect(engine.exec("fontSize", "9999px")).toBe(false);
    expect(engine.exec("lineHeight", "0.1")).toBe(false);
    expect(engine.exec("lineHeight", "normal; color: red")).toBe(false);
  });

  it("wraps selected blocks in persistent columns and removes columns", () => {
    const engine = new EditorEngine(
      root,
      "<p>Alpha</p><p>Beta</p><p>Gamma</p>",
    );
    const firstText = root.querySelector("p")?.firstChild;
    const lastText = root.querySelectorAll("p")[1]?.firstChild;
    if (!firstText || !lastText) throw new Error("No selectable blocks.");
    const range = document.createRange();
    range.setStart(firstText, 0);
    range.setEnd(lastText, lastText.textContent?.length ?? 0);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    expect(engine.exec("columns", "2")).toBe(true);
    expect(engine.getHTML()).toBe(
      '<div class="scribeva-columns" style="column-count: 2; column-gap: 32px"><p>Alpha</p><p>Beta</p></div><p>Gamma</p>',
    );

    selectText(root, 0, 5);
    expect(engine.exec("columns", "3")).toBe(true);
    expect(engine.getHTML()).toContain("column-count: 3");

    selectText(root, 0, 5);
    expect(engine.exec("columns", "1")).toBe(true);
    expect(engine.getHTML()).toBe(
      "<p>Alpha</p><p>Beta</p><p>Gamma</p>",
    );

    selectText(root, 0, 5);
    expect(engine.exec("columns", "8")).toBe(false);
  });

  it("toggles ordered and unordered lists", () => {
    const engine = new EditorEngine(root, "<p>Item</p>");
    selectText(root);
    expect(engine.exec("bulletList")).toBe(true);
    expect(engine.getHTML()).toBe("<ul><li>Item</li></ul>");
    selectText(root);
    expect(engine.exec("bulletList")).toBe(true);
    expect(engine.getHTML()).toBe("<p>Item</p>");

    selectText(root);
    expect(engine.exec("orderedList")).toBe(true);
    expect(engine.getHTML()).toContain("<ol>");
  });

  it("inserts links, images, text, dividers, and tables", () => {
    const engine = new EditorEngine(root, "<p>Hello</p>");
    selectText(root, 0, 5);
    engine.exec("link", {
      href: "https://example.com",
      text: "Example",
      newTab: true,
    });
    expect(engine.getHTML()).toContain(
      '<a href="https://example.com" rel="noopener noreferrer" target="_blank">Example</a>',
    );

    engine.setHTML("<p>Here</p>");
    selectText(root, 4, 4);
    engine.exec("insertText", " 😊");
    expect(engine.getHTML()).toContain("Here 😊");

    engine.setHTML("<p>Here</p>");
    selectText(root, 4, 4);
    engine.exec("image", { src: "https://example.com/image.png", alt: "Image" });
    expect(engine.getHTML()).toContain('alt="Image"');

    engine.setHTML("<p>Here</p>");
    selectText(root, 4, 4);
    engine.exec("horizontalRule");
    expect(engine.getHTML()).toContain("<hr>");

    engine.setHTML("<p>Here</p>");
    selectText(root, 4, 4);
    engine.exec("table", { rows: 3, columns: 2, header: true });
    expect(engine.getHTML()).toContain("<thead>");
    expect(root.querySelectorAll("tr")).toHaveLength(3);
    expect(root.querySelectorAll("th")).toHaveLength(2);
  });

  it("supports table row and column operations", () => {
    const engine = new EditorEngine(
      root,
      "<table><tbody><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table>",
    );

    selectCell(root);
    engine.exec("tableAddRowBefore");
    expect(root.querySelectorAll("tr")).toHaveLength(3);
    selectCell(root);
    engine.exec("tableAddRowAfter");
    expect(root.querySelectorAll("tr")).toHaveLength(4);
    selectCell(root);
    engine.exec("tableDeleteRow");
    expect(root.querySelectorAll("tr")).toHaveLength(3);

    selectCell(root);
    engine.exec("tableAddColumnBefore");
    expect(root.querySelector("tr")?.children).toHaveLength(3);
    selectCell(root, 0, 1);
    engine.exec("tableAddColumnAfter");
    expect(root.querySelector("tr")?.children).toHaveLength(4);
    selectCell(root, 0, 1);
    engine.exec("tableDeleteColumn");
    expect(root.querySelector("tr")?.children).toHaveLength(3);
  });

  it("supports table headers, merge, split, alignment, and deletion", () => {
    const engine = new EditorEngine(
      root,
      "<table><tbody><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table>",
    );

    selectCell(root);
    engine.exec("tableHeaderRow");
    expect(root.querySelectorAll("th")).toHaveLength(2);

    selectCell(root);
    engine.exec("tableMergeRight");
    expect(root.querySelector("th")?.colSpan).toBe(2);
    selectCell(root);
    engine.exec("tableSplitCell");
    expect(root.querySelector("tr")?.children).toHaveLength(2);

    selectCell(root);
    engine.exec("tableVerticalAlign", "middle");
    expect(engine.getHTML()).toContain("vertical-align: middle");

    selectCell(root);
    engine.exec("tableDelete");
    expect(root.querySelector("table")).toBeNull();
  });

  it("styles table outlines, grid lines, and cell fills", () => {
    const engine = new EditorEngine(
      root,
      "<table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>",
    );

    selectCell(root);
    expect(engine.exec("tableBorderColor", "#315f4c")).toBe(true);
    selectCell(root);
    expect(engine.exec("tableBorderWidth", "3")).toBe(true);
    selectCell(root);
    expect(engine.exec("tableBorderStyle", "dashed")).toBe(true);
    selectCell(root);
    expect(engine.exec("tableFillColor", "#e4eee8")).toBe(true);

    const table = root.querySelector("table")!;
    const cells = Array.from(root.querySelectorAll<HTMLElement>("td"));
    expect(table.style.borderColor).toBe("rgb(49, 95, 76)");
    expect(cells.every((cell) => cell.style.borderWidth === "3px")).toBe(true);
    expect(cells.every((cell) => cell.style.borderStyle === "dashed")).toBe(true);
    expect(cells[0]?.style.backgroundColor).toBe("rgb(228, 238, 232)");

    selectCell(root);
    expect(engine.exec("tableClearFormatting")).toBe(true);
    expect(table.getAttribute("style")).toBeNull();
    expect(cells.every((cell) => cell.getAttribute("style") === null)).toBe(true);

    selectCell(root);
    expect(engine.exec("tableBorderWidth", "20")).toBe(false);
    expect(engine.exec("tableBorderStyle", "groove")).toBe(false);
  });

  it("applies every supported table border edge preset", () => {
    const engine = new EditorEngine(
      root,
      "<table><tbody><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table>",
    );
    const value = {
      color: "#315f4c",
      width: "2",
      style: "dashed",
    };

    for (const edges of [
      "top",
      "bottom",
      "left",
      "right",
      "horizontal",
      "vertical",
      "all",
      "none",
    ]) {
      selectCell(root);
      expect(engine.exec("tableBorders", { ...value, edges })).toBe(true);
      const cells = Array.from(root.querySelectorAll<HTMLElement>("td"));
      if (edges === "all") {
        expect(cells.every((cell) => cell.style.borderTopWidth === "2px")).toBe(
          true,
        );
      }
      if (edges === "none") {
        expect(cells.every((cell) => cell.style.borderTopWidth === "0px")).toBe(
          true,
        );
      }
    }

    selectCell(root);
    expect(
      engine.exec("tableBorders", { ...value, edges: "diagonal" }),
    ).toBe(false);
  });

  it("returns false for commands without a usable selection or definition", () => {
    const engine = new EditorEngine(root, "<p>Hello</p>");
    window.getSelection()?.removeAllRanges();
    expect(engine.exec("bold")).toBe(false);
    expect(engine.exec("missing")).toBe(false);
    expect(engine.exec("link", null)).toBe(false);
    expect(engine.exec("image", null)).toBe(false);

    const custom = vi.fn(() => true);
    const unregister = engine.registerCommand("custom", custom);
    expect(engine.exec("custom", 1)).toBe(true);
    unregister();
    expect(engine.exec("custom")).toBe(false);
  });
});
