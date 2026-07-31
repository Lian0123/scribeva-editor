import { describe, expect, it } from "vitest";
import { normalizePastedHTML, sanitizeHTML } from "../src/security/sanitizer";

describe("sanitizeHTML", () => {
  it("removes executable markup and event attributes", () => {
    const result = sanitizeHTML(`
      <script>alert(1)</script>
      <p onclick="alert(1)">Safe <img src="javascript:alert(1)" onerror="x"></p>
      <a href="javascript:alert(1)" target="_blank">Link</a>
    `);

    expect(result).not.toContain("script");
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("javascript:");
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it("keeps supported semantic content and canonical attribute order", () => {
    expect(
      sanitizeHTML('<p style="color: red; position: fixed"><strong>Hello</strong></p>'),
    ).toBe('<p style="color: red"><strong>Hello</strong></p>');
  });

  it("preserves safe table borders and fills", () => {
    expect(
      sanitizeHTML(
        '<table style="border-width: 2px; border-style: dashed; border-color: #315f4c"><tr><td style="background-color: #e4eee8">A</td></tr></table>',
      ),
    ).toContain(
      'style="border-color: #315f4c; border-style: dashed; border-width: 2px"',
    );
  });

  it("preserves safe multi-column document layout", () => {
    expect(
      sanitizeHTML(
        '<div class="scribeva-columns" style="column-gap: 32px; column-count: 2; position: fixed"><p>A</p><p>B</p></div><div style="column-count: 999; column-gap: 99999px">C</div>',
      ),
    ).toBe(
      '<div class="scribeva-columns" style="column-count: 2; column-gap: 32px"><p>A</p><p>B</p></div><div>C</div>',
    );
  });

  it("unwraps unknown elements while dropping dangerous element contents", () => {
    expect(sanitizeHTML("<custom>Keep</custom><iframe>Drop</iframe>")).toBe(
      "Keep",
    );
  });
});

describe("normalizePastedHTML", () => {
  it("removes common Microsoft Office metadata", () => {
    const result = normalizePastedHTML(
      '<p class="MsoNormal" style="mso-margin-top-alt:auto;color: blue">Text</p>',
    );
    expect(result).toBe('<p style="color: blue">Text</p>');
  });
});
