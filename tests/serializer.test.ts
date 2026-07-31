import { describe, expect, it } from "vitest";
import { htmlToJSON, jsonToHTML } from "../src/security/serializer";

describe("HTML and JSON conversion", () => {
  it("round-trips supported document structure", () => {
    const input =
      '<h1>Title</h1><p>Hello <strong>world</strong>.</p><ul><li>One</li></ul>';
    const json = htmlToJSON(input);

    expect(json.type).toBe("doc");
    expect(json.content[0]?.type).toBe("heading1");
    expect(json.content[1]?.content?.[1]?.marks?.[0]?.type).toBe("bold");
    expect(jsonToHTML(json)).toBe(input);
  });

  it("creates a paragraph for an empty document", () => {
    expect(htmlToJSON("").content).toEqual([
      { type: "paragraph", content: [] },
    ]);
  });

  it("round-trips column containers without flattening their blocks", () => {
    const input =
      '<div class="scribeva-columns" style="column-count: 2; column-gap: 32px"><p>Alpha</p><p>Beta</p></div>';
    const json = htmlToJSON(input);

    expect(json.content[0]?.type).toBe("columns");
    expect(json.content[0]?.content?.map((node) => node.type)).toEqual([
      "paragraph",
      "paragraph",
    ]);
    expect(jsonToHTML(json)).toBe(input);
  });
});
