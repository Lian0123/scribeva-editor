import { describe, expect, it } from "vitest";
import { formatHTML } from "../src/security/formatter";

describe("HTML source formatter", () => {
  it("formats nested block markup without changing inline content", () => {
    expect(
      formatHTML(
        '<h1>Title</h1><p>Hello <strong>world</strong>.</p><ul><li>One</li><li>Two</li></ul>',
      ),
    ).toBe(
      '<h1>Title</h1>\n<p>Hello <strong>world</strong>.</p>\n<ul>\n  <li>One</li>\n  <li>Two</li>\n</ul>',
    );
  });

  it("does not turn formatting whitespace into source content", () => {
    const formatted = formatHTML("\n  <p>A</p>\n  <p>B</p>\n");
    expect(formatted).toBe("<p>A</p>\n<p>B</p>");
    expect(formatted).not.toContain("  <p>");
  });
});
