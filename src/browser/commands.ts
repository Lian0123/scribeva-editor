import type { EditorCommand, EditorCommandContext } from "../core/types";

function selectionWithin(root: HTMLElement): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  return root.contains(range.commonAncestorContainer) ? range : null;
}

function selectContents(node: Node, collapseToEnd = true): void {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(collapseToEnd);
  selection.removeAllRanges();
  selection.addRange(range);
}

function closestElement(
  node: Node | null,
  selector: string,
  root: HTMLElement,
): HTMLElement | null {
  const element =
    node?.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node?.parentElement;
  const closest = element?.closest<HTMLElement>(selector) ?? null;
  return closest && root.contains(closest) ? closest : null;
}

function wrapRange(root: HTMLElement, tag: string, attrs?: Record<string, string>): boolean {
  const range = selectionWithin(root);
  if (!range) return false;

  const wrapper = document.createElement(tag);
  Object.entries(attrs ?? {}).forEach(([name, value]) =>
    wrapper.setAttribute(name, value),
  );

  if (range.collapsed) {
    wrapper.append(document.createTextNode("\u200b"));
    range.insertNode(wrapper);
    selectContents(wrapper);
    return true;
  }

  const fragment = range.extractContents();
  wrapper.append(fragment);
  range.insertNode(wrapper);
  const selection = window.getSelection();
  range.selectNodeContents(wrapper);
  selection?.removeAllRanges();
  selection?.addRange(range);
  return true;
}

function unwrap(element: HTMLElement): void {
  element.replaceWith(...Array.from(element.childNodes));
}

function toggleInline(tag: string, aliases: string[] = []): EditorCommand {
  return ({ element, commit }) => {
    const range = selectionWithin(element);
    if (!range) return false;
    const selector = [tag, ...aliases].join(",");
    const active = closestElement(range.startContainer, selector, element);
    if (active) {
      unwrap(active);
      commit("command");
      return true;
    }
    const changed = wrapRange(element, tag);
    if (changed) commit("command");
    return changed;
  };
}

function applyInlineStyle(property: string): EditorCommand {
  return ({ element, commit }, rawValue) => {
    const value = typeof rawValue === "string" ? rawValue.trim() : "";
    if (!value) return false;
    const changed = wrapRange(element, "span", {
      style: `${property}: ${value}`,
    });
    if (changed) commit("command");
    return changed;
  };
}

function clearInlineStyle(property: string): EditorCommand {
  return ({ element, commit }) => {
    const range = selectionWithin(element);
    if (!range) return false;
    const targets = Array.from(element.querySelectorAll<HTMLElement>("span"))
      .filter((span) => {
        try {
          return range.intersectsNode(span) && Boolean(span.style.getPropertyValue(property));
        } catch {
          return false;
        }
      });
    const active = closestElement(range.startContainer, "span", element);
    if (active?.style.getPropertyValue(property) && !targets.includes(active)) {
      targets.push(active);
    }
    if (!targets.length) return false;
    targets.forEach((target) => {
      target.style.removeProperty(property);
      if (!target.getAttribute("style")?.trim()) unwrap(target);
    });
    commit("command");
    return true;
  };
}

function normalizeFontSize(rawValue: unknown): string | null {
  const value =
    typeof rawValue === "number"
      ? String(rawValue)
      : typeof rawValue === "string"
        ? rawValue.trim()
        : "";
  const match = /^(\d+(?:\.\d+)?)(px|pt|em|rem|%)?$/i.exec(value);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = (match[2] ?? "px").toLowerCase();
  const limits: Record<string, [number, number]> = {
    px: [6, 512],
    pt: [4.5, 384],
    em: [0.25, 32],
    rem: [0.25, 32],
    "%": [25, 3200],
  };
  const [minimum, maximum] = limits[unit] ?? [Number.NaN, Number.NaN];
  return Number.isFinite(amount) && amount >= minimum && amount <= maximum
    ? `${amount}${unit}`
    : null;
}

function normalizeLineHeight(rawValue: unknown): string | null {
  const value =
    typeof rawValue === "number"
      ? String(rawValue)
      : typeof rawValue === "string"
        ? rawValue.trim()
        : "";
  const match = /^(\d+(?:\.\d+)?)(%)?$/.exec(value);
  if (!match) return null;
  const amount = Number(match[1]);
  const isPercentage = match[2] === "%";
  const valid = isPercentage
    ? amount >= 50 && amount <= 500
    : amount >= 0.5 && amount <= 5;
  return Number.isFinite(amount) && valid
    ? `${amount}${isPercentage ? "%" : ""}`
    : null;
}

function applyValidatedInlineStyle(
  property: string,
  normalize: (value: unknown) => string | null,
): EditorCommand {
  return (context, rawValue) => {
    const value = normalize(rawValue);
    return value ? applyInlineStyle(property)(context, value) : false;
  };
}

function setBlock(tag: string): EditorCommand {
  return ({ element, commit }) => {
    const range = selectionWithin(element);
    if (!range) return false;
    const block = closestElement(
      range.startContainer,
      "p,h1,h2,h3,h4,h5,h6,blockquote,pre,li,div",
      element,
    );
    if (!block || block.tagName.toLowerCase() === tag) return false;

    const replacement = document.createElement(tag);
    replacement.innerHTML = block.innerHTML;
    for (const attribute of Array.from(block.attributes)) {
      if (attribute.name === "style") {
        replacement.setAttribute(attribute.name, attribute.value);
      }
    }
    block.replaceWith(replacement);
    selectContents(replacement);
    commit("command");
    return true;
  };
}

function setBlockStyle(property: string): EditorCommand {
  return ({ element, commit }, rawValue) => {
    const value = typeof rawValue === "string" ? rawValue : "";
    const range = selectionWithin(element);
    if (!range || !value) return false;
    const block = closestElement(
      range.startContainer,
      "p,h1,h2,h3,h4,h5,h6,blockquote,pre,li,div",
      element,
    );
    if (!block) return false;
    block.style.setProperty(property, value);
    commit("command");
    return true;
  };
}

function setValidatedBlockStyle(
  property: string,
  normalize: (value: unknown) => string | null,
): EditorCommand {
  return (context, rawValue) => {
    const value = normalize(rawValue);
    return value ? setBlockStyle(property)(context, value) : false;
  };
}

function topLevelElement(node: Node, root: HTMLElement): HTMLElement | null {
  let element =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : node.parentElement;
  while (element?.parentElement && element.parentElement !== root) {
    element = element.parentElement;
  }
  return element?.parentElement === root ? element : null;
}

function setColumns(
  { element, commit }: EditorCommandContext,
  rawValue: unknown,
): boolean {
  const value =
    typeof rawValue === "number"
      ? rawValue
      : typeof rawValue === "string" && /^\d+$/.test(rawValue.trim())
        ? Number(rawValue)
        : Number.NaN;
  if (![1, 2, 3, 4].includes(value)) return false;

  const range = selectionWithin(element);
  if (!range) return false;
  const existing = closestElement(
    range.startContainer,
    "div.scribeva-columns",
    element,
  );
  if (existing) {
    if (value === 1) {
      existing.replaceWith(...Array.from(existing.childNodes));
    } else {
      existing.style.columnCount = String(value);
      existing.style.columnGap = "32px";
    }
    commit("command");
    return true;
  }
  if (value === 1) return false;

  const start = topLevelElement(range.startContainer, element);
  const end = topLevelElement(range.endContainer, element);
  if (!start || !end) return false;
  const children = Array.from(element.children);
  const startIndex = children.indexOf(start);
  const endIndex = children.indexOf(end);
  if (startIndex < 0 || endIndex < startIndex) return false;

  const columns = document.createElement("div");
  columns.className = "scribeva-columns";
  columns.style.columnCount = String(value);
  columns.style.columnGap = "32px";
  start.before(columns);
  children
    .slice(startIndex, endIndex + 1)
    .forEach((child) => columns.append(child));
  commit("command");
  return true;
}

function toggleList(tag: "ul" | "ol"): EditorCommand {
  return ({ element, commit }) => {
    const range = selectionWithin(element);
    if (!range) return false;
    const listItem = closestElement(range.startContainer, "li", element);
    if (listItem) {
      const list = listItem.parentElement;
      const paragraph = document.createElement("p");
      paragraph.innerHTML = listItem.innerHTML;
      list?.insertAdjacentElement("beforebegin", paragraph);
      listItem.remove();
      if (list && list.children.length === 0) list.remove();
      selectContents(paragraph);
      commit("command");
      return true;
    }

    const block = closestElement(
      range.startContainer,
      "p,h1,h2,h3,h4,h5,h6,blockquote,pre,div",
      element,
    );
    if (!block) return false;
    const list = document.createElement(tag);
    const item = document.createElement("li");
    item.innerHTML = block.innerHTML;
    list.append(item);
    block.replaceWith(list);
    selectContents(item);
    commit("command");
    return true;
  };
}

function insertHTML(root: HTMLElement, html: string): boolean {
  const range = selectionWithin(root);
  if (!range) return false;
  range.deleteContents();
  const template = document.createElement("template");
  template.innerHTML = html;
  const fragment = template.content;
  const last = fragment.lastChild;
  range.insertNode(fragment);
  if (last) {
    const selection = window.getSelection();
    const nextRange = document.createRange();
    nextRange.setStartAfter(last);
    nextRange.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(nextRange);
  }
  return true;
}

const insertText: EditorCommand = ({ element, commit }, rawValue) => {
  const value = typeof rawValue === "string" ? rawValue : "";
  const range = selectionWithin(element);
  if (!range || !value) return false;
  const text = document.createTextNode(value);
  range.deleteContents();
  range.insertNode(text);
  const selection = window.getSelection();
  range.setStartAfter(text);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
  commit("command");
  return true;
};

const insertLink: EditorCommand = ({ element, commit }, rawValue) => {
  if (!rawValue || typeof rawValue !== "object") return false;
  const value = rawValue as { href?: string; text?: string; newTab?: boolean };
  if (!value.href) return false;
  const range = selectionWithin(element);
  if (!range) return false;

  const link = document.createElement("a");
  link.href = value.href;
  if (value.newTab) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  link.textContent =
    value.text || (range.collapsed ? value.href : range.toString());
  range.deleteContents();
  range.insertNode(link);
  selectContents(link);
  commit("command");
  return true;
};

const insertImage: EditorCommand = ({ element, commit }, rawValue) => {
  if (!rawValue || typeof rawValue !== "object") return false;
  const value = rawValue as { src?: string; alt?: string };
  if (!value.src) return false;
  const image = document.createElement("img");
  image.src = value.src;
  image.alt = value.alt ?? "";
  const changed = insertHTML(element, image.outerHTML);
  if (changed) commit("command");
  return changed;
};

const insertTable: EditorCommand = ({ element, commit }, rawValue) => {
  const value = (rawValue ?? {}) as {
    rows?: number;
    columns?: number;
    header?: boolean;
  };
  const rows = Math.min(12, Math.max(1, Number(value.rows) || 3));
  const columns = Math.min(12, Math.max(1, Number(value.columns) || 3));
  const bodyCells = Array.from(
    { length: columns },
    () => "<td><p><br></p></td>",
  ).join("");
  const headerCells = Array.from(
    { length: columns },
    () => "<th scope=\"col\"><p><br></p></th>",
  ).join("");
  const header = value.header
    ? `<thead><tr>${headerCells}</tr></thead>`
    : "";
  const bodyRowCount = value.header ? Math.max(1, rows - 1) : rows;
  const body = `<tbody>${Array.from(
    { length: bodyRowCount },
    () => `<tr>${bodyCells}</tr>`,
  ).join("")}</tbody>`;
  const html = `<table>${header}${body}</table><p><br></p>`;
  const changed = insertHTML(element, html);
  if (changed) commit("command");
  return changed;
};

interface TableContext {
  cell: HTMLTableCellElement;
  row: HTMLTableRowElement;
  table: HTMLTableElement;
  columnIndex: number;
}

function selectedTableContext(root: HTMLElement): TableContext | null {
  const range = selectionWithin(root);
  if (!range) return null;
  const cell = closestElement(
    range.startContainer,
    "td,th",
    root,
  ) as HTMLTableCellElement | null;
  const row = cell?.closest("tr") as HTMLTableRowElement | null;
  const table = cell?.closest("table") as HTMLTableElement | null;
  if (!cell || !row || !table) return null;
  return {
    cell,
    row,
    table,
    columnIndex: Array.from(row.cells).indexOf(cell),
  };
}

function createEmptyCell(tag: "td" | "th" = "td"): HTMLTableCellElement {
  const cell = document.createElement(tag);
  if (tag === "th") cell.scope = "col";
  cell.innerHTML = "<p><br></p>";
  return cell;
}

function tableMutation(
  mutate: (context: TableContext) => HTMLElement | null | void,
): EditorCommand {
  return ({ element, commit }) => {
    const context = selectedTableContext(element);
    if (!context) return false;
    const focusTarget = mutate(context);
    if (focusTarget) selectContents(focusTarget);
    commit("command");
    return true;
  };
}

const tableAddRowBefore = tableMutation(({ row }) => {
  const next = row.cloneNode(false) as HTMLTableRowElement;
  Array.from(row.cells).forEach((cell) =>
    next.append(createEmptyCell(cell.tagName.toLowerCase() === "th" ? "th" : "td")),
  );
  row.before(next);
  return next.cells[0] ?? next;
});

const tableAddRowAfter = tableMutation(({ row }) => {
  const next = row.cloneNode(false) as HTMLTableRowElement;
  Array.from(row.cells).forEach((cell) =>
    next.append(createEmptyCell(cell.tagName.toLowerCase() === "th" ? "th" : "td")),
  );
  row.after(next);
  return next.cells[0] ?? next;
});

const tableDeleteRow = tableMutation(({ row, table }) => {
  const target =
    (row.nextElementSibling as HTMLTableRowElement | null) ??
    (row.previousElementSibling as HTMLTableRowElement | null);
  row.remove();
  if (!table.querySelector("tr")) {
    table.remove();
    return null;
  }
  return target?.cells[0] ?? table;
});

function tableAddColumn(position: "before" | "after"): EditorCommand {
  return tableMutation(({ table, columnIndex }) => {
    let selected: HTMLTableCellElement | null = null;
    Array.from(table.rows).forEach((row, rowIndex) => {
      const reference = row.cells[columnIndex] ?? row.cells[row.cells.length - 1];
      const tag =
        reference?.tagName.toLowerCase() === "th" ? "th" : ("td" as const);
      const cell = createEmptyCell(tag);
      if (position === "before") reference?.before(cell);
      else reference?.after(cell);
      if (rowIndex === 0) selected = cell;
    });
    return selected ?? table;
  });
}

const tableDeleteColumn = tableMutation(({ table, columnIndex }) => {
  Array.from(table.rows).forEach((row) => {
    const cell = row.cells[columnIndex];
    if (!cell) return;
    if (cell.colSpan > 1) cell.colSpan -= 1;
    else cell.remove();
  });
  if (Array.from(table.rows).every((row) => row.cells.length === 0)) {
    table.remove();
    return null;
  }
  return table.rows[0]?.cells[Math.max(0, columnIndex - 1)] ?? table;
});

const tableMoveColumn: EditorCommand = ({ element, commit }, rawValue) => {
  const context = selectedTableContext(element);
  if (!context || !rawValue || typeof rawValue !== "object") return false;
  const { from, to } = rawValue as { from?: unknown; to?: unknown };
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from === to ||
    Number(from) < 0 ||
    Number(to) < 0 ||
    context.table.querySelector(
      "[colspan]:not([colspan='1']), [rowspan]:not([rowspan='1'])",
    )
  ) {
    return false;
  }
  const sourceIndex = Number(from);
  const targetIndex = Number(to);
  const rows = Array.from(context.table.rows);
  if (
    rows.length === 0 ||
    rows.some(
      (row) => sourceIndex >= row.cells.length || targetIndex >= row.cells.length,
    )
  ) {
    return false;
  }

  rows.forEach((row) => {
    const source = row.cells[sourceIndex];
    const target = row.cells[targetIndex];
    if (!source || !target) return;
    if (sourceIndex < targetIndex) target.after(source);
    else target.before(source);
  });
  const focusTarget = rows[0]?.cells[targetIndex];
  if (focusTarget) selectContents(focusTarget);
  commit("command");
  return true;
};

const tableHeaderRow = tableMutation(({ table }) => {
  const firstRow = table.rows[0];
  if (!firstRow) return table;
  const currentlyHeader = Array.from(firstRow.cells).every(
    (cell) => cell.tagName === "TH",
  );
  Array.from(firstRow.cells).forEach((cell) => {
    const replacement = createEmptyCell(currentlyHeader ? "td" : "th");
    replacement.innerHTML = cell.innerHTML;
    replacement.colSpan = cell.colSpan;
    replacement.rowSpan = cell.rowSpan;
    cell.replaceWith(replacement);
  });
  return table.rows[0]?.cells[0] ?? table;
});

const tableMergeRight = tableMutation(({ cell }) => {
  const next = cell.nextElementSibling as HTMLTableCellElement | null;
  if (!next) return cell;
  const divider = document.createElement("br");
  cell.append(divider, ...Array.from(next.childNodes));
  cell.colSpan += next.colSpan;
  next.remove();
  return cell;
});

const tableSplitCell = tableMutation(({ cell }) => {
  if (cell.colSpan <= 1) return cell;
  const count = cell.colSpan - 1;
  cell.colSpan = 1;
  let cursor: HTMLTableCellElement = cell;
  for (let index = 0; index < count; index += 1) {
    const created = createEmptyCell(
      cell.tagName.toLowerCase() === "th" ? "th" : "td",
    );
    cursor.after(created);
    cursor = created;
  }
  return cell;
});

const tableDelete = tableMutation(({ table }) => {
  const paragraph = document.createElement("p");
  paragraph.append(document.createElement("br"));
  table.replaceWith(paragraph);
  return paragraph;
});

const tableToggleSortable = tableMutation(({ table, cell }) => {
  if (!table.querySelector("th")) return cell;
  if (table.dataset.scribevaSortable === "true") {
    delete table.dataset.scribevaSortable;
  } else {
    table.dataset.scribevaSortable = "true";
  }
  return cell;
});

function applyTableBorderStyle(
  context: TableContext,
  property: "border-color" | "border-style" | "border-width",
  value: string,
): void {
  context.table.style.setProperty(property, value);
  context.table
    .querySelectorAll<HTMLTableCellElement>("th,td")
    .forEach((cell) => cell.style.setProperty(property, value));
}

type TableBorderEdges =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "horizontal"
  | "vertical"
  | "all"
  | "none";

const tableBorders: EditorCommand = ({ element, commit }, rawValue) => {
  const context = selectedTableContext(element);
  if (!context || !rawValue || typeof rawValue !== "object") return false;
  const value = rawValue as {
    edges?: TableBorderEdges;
    color?: string;
    width?: number | string;
    style?: string;
  };
  const edges = value.edges;
  const color = typeof value.color === "string" ? value.color.trim() : "";
  const width = Number(value.width);
  const style = typeof value.style === "string" ? value.style : "";
  const supportedEdges: TableBorderEdges[] = [
    "top",
    "bottom",
    "left",
    "right",
    "horizontal",
    "vertical",
    "all",
    "none",
  ];
  if (
    !edges ||
    !supportedEdges.includes(edges) ||
    !color ||
    !Number.isFinite(width) ||
    width < 0 ||
    width > 8 ||
    !["solid", "dashed", "dotted", "double"].includes(style)
  ) {
    return false;
  }

  const cells = Array.from(
    context.table.querySelectorAll<HTMLTableCellElement>("th,td"),
  );
  const clear = (cell: HTMLTableCellElement) => {
    ["top", "right", "bottom", "left"].forEach((side) => {
      cell.style.setProperty(`border-${side}-width`, "0px");
      cell.style.removeProperty(`border-${side}-color`);
      cell.style.removeProperty(`border-${side}-style`);
    });
  };
  const set = (cell: HTMLTableCellElement, side: string) => {
    cell.style.setProperty(`border-${side}-color`, color);
    cell.style.setProperty(`border-${side}-style`, style);
    cell.style.setProperty(`border-${side}-width`, `${width}px`);
  };
  cells.forEach(clear);
  context.table.style.border = "none";

  if (edges !== "none") {
    const rows = Array.from(context.table.rows);
    const firstRow = rows[0];
    const lastRow = rows.at(-1);
    const applyTop = edges === "top" || edges === "horizontal" || edges === "all";
    const applyBottom =
      edges === "bottom" || edges === "horizontal" || edges === "all";
    const applyLeft = edges === "left" || edges === "vertical" || edges === "all";
    const applyRight =
      edges === "right" || edges === "vertical" || edges === "all";

    if (edges === "all") {
      cells.forEach((cell) =>
        ["top", "right", "bottom", "left"].forEach((side) => set(cell, side)),
      );
    } else {
      if (applyTop) Array.from(firstRow?.cells ?? []).forEach((cell) => set(cell, "top"));
      if (applyBottom) Array.from(lastRow?.cells ?? []).forEach((cell) => set(cell, "bottom"));
      rows.forEach((row) => {
        if (applyLeft && row.cells[0]) set(row.cells[0], "left");
        if (applyRight && row.cells[row.cells.length - 1]) {
          set(row.cells[row.cells.length - 1]!, "right");
        }
      });
    }
  }
  commit("command");
  return true;
};

const tableBorderColor: EditorCommand = ({ element, commit }, rawValue) => {
  const context = selectedTableContext(element);
  const value = typeof rawValue === "string" ? rawValue.trim() : "";
  if (!context || !value) return false;
  applyTableBorderStyle(context, "border-color", value);
  commit("command");
  return true;
};

const tableBorderWidth: EditorCommand = ({ element, commit }, rawValue) => {
  const context = selectedTableContext(element);
  const width = Number(rawValue);
  if (!context || !Number.isFinite(width) || width < 0 || width > 8) {
    return false;
  }
  applyTableBorderStyle(context, "border-width", `${width}px`);
  commit("command");
  return true;
};

const tableBorderStyle: EditorCommand = ({ element, commit }, rawValue) => {
  const context = selectedTableContext(element);
  const value = typeof rawValue === "string" ? rawValue : "";
  if (!context || !["solid", "dashed", "dotted", "double"].includes(value)) {
    return false;
  }
  applyTableBorderStyle(context, "border-style", value);
  commit("command");
  return true;
};

const tableFillColor: EditorCommand = ({ element, commit }, rawValue) => {
  const context = selectedTableContext(element);
  const value = typeof rawValue === "string" ? rawValue.trim() : "";
  if (!context || !value) return false;
  context.cell.style.backgroundColor = value;
  commit("command");
  return true;
};

const tableClearFormatting = tableMutation(({ table }) => {
  const properties = [
    "background-color",
    "border-color",
    "border-style",
    "border-width",
    ...["top", "right", "bottom", "left"].flatMap((side) =>
      ["color", "style", "width"].map((property) => `border-${side}-${property}`),
    ),
  ];
  [table, ...Array.from(table.querySelectorAll<HTMLElement>("th,td"))].forEach(
    (element) => {
      properties.forEach((property) => element.style.removeProperty(property));
      if (element.style.length === 0) element.removeAttribute("style");
    },
  );
});

const insertHorizontalRule: EditorCommand = ({ element, commit }) => {
  const changed = insertHTML(element, "<hr><p><br></p>");
  if (changed) commit("command");
  return changed;
};

const insertPageBreak: EditorCommand = ({ element, commit }) => {
  const changed = insertHTML(
    element,
    '<hr class="scribeva-page-break"><p><br></p>',
  );
  if (changed) commit("command");
  return changed;
};

const selectAll: EditorCommand = ({ element }) => {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection?.removeAllRanges();
  selection?.addRange(range);
  return true;
};

export function createDefaultCommands(): Record<string, EditorCommand> {
  return {
    bold: toggleInline("strong", ["b"]),
    italic: toggleInline("em", ["i"]),
    underline: toggleInline("u"),
    strike: toggleInline("s", ["del"]),
    inlineCode: toggleInline("code"),
    paragraph: setBlock("p"),
    heading1: setBlock("h1"),
    heading2: setBlock("h2"),
    heading3: setBlock("h3"),
    blockquote: setBlock("blockquote"),
    codeBlock: setBlock("pre"),
    bulletList: toggleList("ul"),
    orderedList: toggleList("ol"),
    align: setBlockStyle("text-align"),
    lineHeight: setValidatedBlockStyle("line-height", normalizeLineHeight),
    fontFamily: applyInlineStyle("font-family"),
    fontSize: applyValidatedInlineStyle("font-size", normalizeFontSize),
    textColor: applyInlineStyle("color"),
    highlight: applyInlineStyle("background-color"),
    backgroundColor: applyInlineStyle("background-color"),
    clearBackgroundColor: clearInlineStyle("background-color"),
    indent: ({ element, commit }) => {
      const range = selectionWithin(element);
      if (!range) return false;
      const block = closestElement(
        range.startContainer,
        "p,h1,h2,h3,h4,h5,h6,blockquote,pre,li,div",
        element,
      );
      if (!block) return false;
      const current = Number.parseInt(block.style.marginLeft || "0", 10);
      block.style.marginLeft = `${Math.min(240, current + 32)}px`;
      commit("command");
      return true;
    },
    outdent: ({ element, commit }) => {
      const range = selectionWithin(element);
      if (!range) return false;
      const block = closestElement(
        range.startContainer,
        "p,h1,h2,h3,h4,h5,h6,blockquote,pre,li,div",
        element,
      );
      if (!block) return false;
      const current = Number.parseInt(block.style.marginLeft || "0", 10);
      block.style.marginLeft = `${Math.max(0, current - 32)}px`;
      commit("command");
      return true;
    },
    link: insertLink,
    image: insertImage,
    insertText,
    table: insertTable,
    tableAddRowBefore,
    tableAddRowAfter,
    tableDeleteRow,
    tableAddColumnBefore: tableAddColumn("before"),
    tableAddColumnAfter: tableAddColumn("after"),
    tableDeleteColumn,
    tableMoveColumn,
    tableHeaderRow,
    tableMergeRight,
    tableSplitCell,
    tableDelete,
    tableToggleSortable,
    tableBorderColor,
    tableBorderWidth,
    tableBorderStyle,
    tableBorders,
    tableFillColor,
    tableClearFormatting,
    tableVerticalAlign: ({ element, commit }, rawValue) => {
      const context = selectedTableContext(element);
      const value =
        typeof rawValue === "string" &&
        ["top", "middle", "bottom"].includes(rawValue)
          ? rawValue
          : "top";
      if (!context) return false;
      context.cell.style.verticalAlign = value;
      commit("command");
      return true;
    },
    horizontalRule: insertHorizontalRule,
    pageBreak: insertPageBreak,
    columns: setColumns,
    selectAll,
  };
}
