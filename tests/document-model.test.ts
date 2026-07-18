import { describe, expect, it, vi } from "vitest";
import { DocumentModel } from "../src/core/document-model";

describe("DocumentModel", () => {
  it("stores sanitized deterministic HTML", () => {
    const model = new DocumentModel('<p onclick="x()">Hello</p>');
    expect(model.html).toBe("<p>Hello</p>");
  });

  it("supports history navigation and change subscriptions", () => {
    const model = new DocumentModel("<p>One</p>");
    const listener = vi.fn();
    model.subscribe(listener);

    model.apply({ html: "<p>Two</p>", source: "command" });
    expect(model.html).toBe("<p>Two</p>");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ source: "command" }),
    );

    expect(model.undo()).toBe(true);
    expect(model.html).toBe("<p>One</p>");
    expect(model.redo()).toBe(true);
    expect(model.html).toBe("<p>Two</p>");
  });

  it("does not create history for identical content", () => {
    const model = new DocumentModel("<p>One</p>");
    expect(model.apply({ html: "<p>One</p>" })).toBe(false);
    expect(model.undo()).toBe(false);
  });
});
