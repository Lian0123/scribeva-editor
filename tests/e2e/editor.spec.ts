import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("scribeva-site-locale", "zh-TW");
  });
});

test("loads the enterprise editor and edits content", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Scribeva", { exact: true }).first()).toBeVisible();
  await expect(page.locator(".scribeva__ribbon").first()).toBeVisible();

  const editor = page.locator("[data-scribeva-content]");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type(" Playwright");
  await expect(editor).toContainText("Playwright");
});

test("switches ribbon tabs and theme", async ({ page }) => {
  await page.goto("/");
  const root = page.locator(".scribeva");

  await page.getByRole("tab", { name: "檢視" }).click();
  await page.locator('[data-theme-choice="dark"]').click();

  await expect(root).toHaveAttribute("data-theme", "dark");
  await page.locator('[data-secondary-color]').fill("#2878a8");
  await expect.poll(() => root.evaluate((element) => element.style.getPropertyValue("--scribeva-secondary"))).toBe("#2878a8");
});

test("applies a text animation from the dedicated Animation tab", async ({ page }) => {
  await page.goto("/");
  const paragraph = page.locator('[data-scribeva-content] p').first();
  await paragraph.click();
  await page.getByRole("tab", { name: "動畫" }).click();
  await expect(page.locator('[data-panel="animation"]')).toBeVisible();
  await page.locator('[data-animation-effect]').selectOption("bounce");
  await page.locator('[data-command="animation:apply"]').click();
  await expect(paragraph).toHaveClass(/scribeva-motion-bounce/);
  await page.locator('[data-command="animation:clear"]').click();
  await expect(paragraph).not.toHaveClass(/scribeva-motion-/);
});

test("keeps ribbon groups aligned and animates tab transitions", async ({ page }) => {
  await page.goto("/");
  const heights = await page.locator('.scribeva__ribbon:not([hidden]) > .scribeva__group').evaluateAll(
    (groups) => groups.map((group) => Math.round(group.getBoundingClientRect().height)),
  );
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
  await page.getByRole("tab", { name: "檢視" }).click();
  await expect(page.locator('.scribeva__ribbon[data-panel="view"]')).toHaveClass(/is-panel-entering/);
});

test("supports touch-sized Ribbon controls and stacked mobile panels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const root = page.locator(".scribeva");
  const rootBox = await root.boundingBox();
  if (!rootBox) throw new Error("Mobile editor is not visible.");
  expect(rootBox.width).toBeLessThanOrEqual(390);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);

  await page.getByRole("tab", { name: "檢視" }).click();
  await expect(page.locator(".scribeva__view-section")).toHaveCount(3);
  await expect(page.locator('[data-theme-choice="dark"]')).toBeVisible();
  await expect(page.locator('[data-theme-choice="dark"]')).toHaveCSS(
    "min-height",
    "40px",
  );

  await page.getByRole("tab", { name: "模板式樣" }).click();
  await expect(page.locator("[data-template-id]")).toHaveCount(9);
  const applyBox = await page
    .locator(".scribeva__template-apply .scribeva__button")
    .boundingBox();
  if (!applyBox) throw new Error("Mobile template action is not visible.");
  expect(applyBox.width).toBeLessThanOrEqual(390);
});

test("edits sanitized HTML source with code-editor affordances", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "HTML 編輯" }).click();
  const source = page.locator("[data-scribeva-source]");
  await expect(source).toBeVisible();
  await expect(page.locator("[data-source-lines]")).toContainText("2");

  await source.fill(
    '<h2 onclick="alert(1)">原始碼模式</h2>\n<script>bad()</script><p>安全內容</p>',
  );
  await source.press("ControlOrMeta+s");
  await expect(source).not.toContainText("script");

  await page.getByRole("tab", { name: "常用" }).click();
  const document = page.locator("[data-scribeva-content]");
  await expect(document).toContainText("原始碼模式");
  await expect(document).toContainText("安全內容");
  await expect(document.locator("script")).toHaveCount(0);

  await document.click();
  await page.keyboard.press("ControlOrMeta+z");
  await expect(document).not.toContainText("原始碼模式");
});

test("undoes and redoes keyboard input", async ({ page }) => {
  await page.goto("/");
  const editor = page.locator("[data-scribeva-content]");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type(" HISTORY_TEST");
  await expect(editor).toContainText("HISTORY_TEST");

  await page.keyboard.press("ControlOrMeta+z");
  await expect(editor).not.toContainText("HISTORY_TEST");
  await page.keyboard.press("ControlOrMeta+Shift+z");
  await expect(editor).toContainText("HISTORY_TEST");
});

test("cancels a required link dialog without validation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "插入" }).click();
  await page.getByRole("button", { name: "連結" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "取消" }).last().click();
  await expect(dialog).toBeHidden();
});

test("switches the website and editor to Japanese", async ({ page }) => {
  await page.goto("/");
  await page.locator("#site-locale").selectOption("ja");
  await expect(page.getByRole("tab", { name: "ホーム" })).toBeVisible();
  await expect(page.locator("#hero-title")).toContainText("移植可能");
  await expect(page.locator("[data-scribeva-content]")).toContainText("運用概要");
});

test("inserts emoji and opens document preview", async ({ page }) => {
  await page.goto("/");
  const editor = page.locator("[data-scribeva-content]");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.getByRole("tab", { name: "插入" }).click();
  await page.getByRole("button", { name: "表情符號" }).click();
  await page.getByRole("button", { name: "😀" }).click();
  await expect(editor).toContainText("😀");

  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.getByRole("button", { name: "表情符號" }).click();
  await page.getByLabel("其他表情符號").fill("🫶🏽");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "插入" })
    .click();
  await expect(editor).toContainText("🫶🏽");

  await page.getByRole("tab", { name: "檢視" }).click();
  await page.getByRole("button", { name: "預覽" }).click();
  await expect(page.locator(".scribeva__preview")).toBeVisible();
});

test("uses custom typography, mathematical symbols, and columns", async ({
  page,
}) => {
  await page.goto("/");
  const editor = page.locator("[data-scribeva-content]");
  const firstParagraph = editor.locator("p").first();

  await firstParagraph.click();
  const lineHeightPreset = page.locator('[data-value-preset="lineHeight"]');
  await lineHeightPreset.selectOption("2");
  await expect(firstParagraph).toHaveAttribute("style", /line-height: 2/);

  await firstParagraph.click();
  const lineHeight = page.locator('[data-command-value="lineHeight"]');
  await expect(lineHeight).toBeHidden();
  await lineHeightPreset.selectOption("");
  await expect(lineHeight).toBeVisible();
  const lineHeightPresetBox = await lineHeightPreset.boundingBox();
  const lineHeightInputBox = await lineHeight.boundingBox();
  if (!lineHeightPresetBox || !lineHeightInputBox) {
    throw new Error("Line-height controls are not visible.");
  }
  expect(Math.abs(lineHeightInputBox.y - lineHeightPresetBox.y)).toBeLessThan(2);
  expect(lineHeightInputBox.x).toBeGreaterThan(
    lineHeightPresetBox.x + lineHeightPresetBox.width - 1,
  );
  await lineHeight.fill("1.8");
  await lineHeight.press("Tab");
  await expect(firstParagraph).toHaveAttribute("style", /line-height: 1\.8/);

  await firstParagraph.selectText();
  const fontSizePreset = page.locator('[data-value-preset="fontSize"]');
  await fontSizePreset.selectOption("20");
  await expect(firstParagraph.locator("span").first()).toHaveCSS(
    "font-size",
    "20px",
  );

  await firstParagraph.selectText();
  const fontSize = page.locator('[data-command-value="fontSize"]');
  await expect(fontSize).toBeHidden();
  await fontSizePreset.selectOption("");
  await expect(fontSize).toBeVisible();
  await fontSize.fill("19.5");
  await fontSize.press("Tab");
  await expect(firstParagraph.locator("span").first()).toHaveCSS(
    "font-size",
    "19.5px",
  );

  await firstParagraph.click();
  const columns = page.locator('[data-command-select="columns"]');
  await columns.dispatchEvent("mousedown");
  await columns.selectOption("2");
  await expect(editor.locator(".scribeva-columns")).toHaveCSS(
    "column-count",
    "2",
  );

  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.getByRole("tab", { name: "插入" }).click();
  await page.getByRole("button", { name: "數學符號" }).click();
  await page.getByRole("button", { name: "∑", exact: true }).click();
  await expect(editor).toContainText("∑");
});

test("inserts a local image as an editor-owned Blob URL", async ({ page }) => {
  await page.goto("/");
  const editor = page.locator("[data-scribeva-content]");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");

  await page.locator("[data-image-upload]").setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+3fM4WQAAAABJRU5ErkJggg==",
      "base64",
    ),
  });

  await expect(editor.locator('img[alt="pixel.png"]')).toHaveAttribute(
    "src",
    /^blob:/,
  );
});

test("formats table borders and cell fills from the Ribbon", async ({ page }) => {
  await page.goto("/");
  const firstCell = page.locator("[data-scribeva-content] td").first();
  await firstCell.click();
  await page.getByRole("tab", { name: "插入" }).click();

  await page
    .locator('[data-command-input="tableBorderColor"]')
    .evaluate((input: HTMLInputElement) => {
      input.value = "#7b4f2c";
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  await page
    .locator('[data-command-input="tableFillColor"]')
    .evaluate((input: HTMLInputElement) => {
      input.value = "#f0dfc8";
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  await page
    .locator('[data-value-preset="tableBorderWidth"]')
    .selectOption("3");

  await expect(firstCell).toHaveCSS("background-color", "rgb(240, 223, 200)");
  await expect(firstCell).toHaveCSS("border-top-color", "rgb(123, 79, 44)");
  await expect(firstCell).toHaveCSS("border-top-width", "3px");

  await firstCell.click();
  const customBorderWidth = page.locator(
    '[data-command-value="tableBorderWidth"]',
  );
  await expect(customBorderWidth).toBeHidden();
  await page
    .locator('[data-value-preset="tableBorderWidth"]')
    .selectOption("");
  await expect(customBorderWidth).toBeVisible();
  await customBorderWidth.fill("2.5");
  await customBorderWidth.press("Tab");
  await expect(firstCell).toHaveAttribute("style", /border-width: 2\.5px/);
  await expect(
    page.locator('[data-value-preset="tableBorderWidth"]'),
  ).toHaveValue("");

  await page.locator("[data-table-borders]").selectOption("top");
  await expect(firstCell).toHaveCSS("border-top-style", "solid");
  const secondRowCell = page.locator("[data-scribeva-content] tr").nth(1).locator("td").first();
  await expect(secondRowCell).toHaveCSS("border-top-width", "0px");

  await firstCell.click();
  await page.locator("[data-table-borders]").selectOption("none");
  await expect(firstCell).toHaveCSS("border-top-width", "0px");
});

test("shows clear table actions and scales the document canvas", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "插入" }).click();
  await expect(
    page.getByRole("button", { name: "在上方新增列" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "刪除欄" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "在上方新增列" }).locator("svg"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "在上方新增列" }).locator(".scribeva__tool-text"),
  ).toHaveCount(0);

  const document = page.locator("[data-scribeva-content]");
  const initialBox = await document.boundingBox();
  if (!initialBox) throw new Error("Document canvas is not visible.");

  await page.locator("[data-zoom]").fill("130");
  await expect(page.locator("[data-zoom-output]")).toHaveText("130%");
  const zoomedBox = await document.boundingBox();
  if (!zoomedBox) throw new Error("Zoomed document canvas is not visible.");
  expect(zoomedBox.width).toBeGreaterThan(initialBox.width * 1.25);

  await page.getByRole("button", { name: "重設縮放" }).click();
  await expect(page.locator("[data-zoom]")).toHaveValue("100");
  await expect(page.locator("[data-zoom-output]")).toHaveText("100%");
});

test("keeps the toolbar sticky and inserts a printable page break", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "檢視" }).click();
  await page.getByLabel("捲動時保持工具列顯示").check();
  await expect(page.locator(".scribeva")).toHaveClass(/is-toolbar-sticky/);
  await expect(page.locator("[data-scribeva-toolbar]")).toHaveCSS(
    "position",
    "sticky",
  );
  await page.locator('[data-sticky-offset="top"]').fill("24");
  await page.locator('[data-sticky-offset="top"]').press("Tab");
  await page.locator('[data-sticky-offset="bottom"]').fill("80");
  await page.locator('[data-sticky-offset="bottom"]').press("Tab");
  await expect(page.locator(".scribeva")).toHaveCSS(
    "--scribeva-sticky-top",
    "24px",
  );
  await expect(page.locator(".scribeva")).toHaveCSS(
    "--scribeva-sticky-bottom",
    "80px",
  );

  const editor = page.locator("[data-scribeva-content]");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.getByRole("tab", { name: "插入" }).click();
  await page.locator('[data-command="pageBreak"]').click();
  await expect(editor.locator("hr.scribeva-page-break")).toHaveCount(1);
  await page.getByRole("tab", { name: "檢視" }).click();
  const pageBreakToggle = page.getByLabel("顯示換頁符號");
  await expect(pageBreakToggle).toBeChecked();
  await pageBreakToggle.uncheck();
  await expect(page.locator(".scribeva")).toHaveClass(/hide-page-breaks/);
});

test("previews, applies, and undoes a document template", async ({ page }) => {
  await page.goto("/");
  const editor = page.locator("[data-scribeva-content]");
  await page.getByRole("tab", { name: "模板式樣" }).click();
  await expect(page.locator("[data-template-id]")).toHaveCount(9);
  await page.locator('[data-template-id="adConcept"]').click();
  await expect(page.locator("[data-template-preview]")).toContainText(
    "廣告創意提案",
  );
  await page.locator('[data-template-id="manifesto"]').click();
  await expect(page.locator("[data-template-preview]")).toContainText(
    "品牌宣言",
  );
  await page.locator('[data-template-id="newsletter"]').click();
  await expect(page.locator("[data-template-preview]")).toContainText(
    "編輯式電子報",
  );
  await page.getByRole("button", { name: "套用模板" }).click();
  await expect(editor).toContainText("編輯式電子報");
  await expect(editor.locator(".scribeva-page-break")).toHaveCount(1);
  await page.keyboard.press("ControlOrMeta+z");
  await expect(editor).toContainText("營運簡報");
  await expect(editor).not.toContainText("編輯式電子報");
});

test("opens a separate print-ready tab without changing the website", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "檢視" }).click();
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "列印" }).click();
  const printPage = await popupPromise;
  await expect(printPage.locator("main")).toContainText("營運簡報");
  await expect(printPage.locator(".print-toolbar")).toContainText("列印專用文件");
  await expect(page.locator("body")).not.toHaveClass(/scribeva-printing/);
  await expect(page.locator(".scribeva-print-portal")).toHaveCount(0);

  await printPage.evaluate(() => {
    Object.defineProperty(window, "print", {
      configurable: true,
      value: () => document.body.setAttribute("data-print-called", "true"),
    });
  });
  await printPage.getByRole("button", { name: "列印" }).click();
  await expect(printPage.locator("body")).toHaveAttribute(
    "data-print-called",
    "true",
  );
  const closed = printPage.waitForEvent("close");
  await printPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const close = buttons.find((button) => button.textContent === "關閉");
    window.setTimeout(() => close?.click(), 0);
  });
  await closed;
});

test("uses icon-only table structure controls and drags whole columns", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "插入" }).click();
  for (const label of [
    "切換標題列",
    "與右側儲存格合併",
    "拆分儲存格",
    "刪除表格",
  ]) {
    const button = page.getByRole("button", { name: label });
    await expect(button.locator("svg")).toBeVisible();
    await expect(button.locator(".scribeva__tool-text")).toHaveCount(0);
  }

  const table = page.locator("[data-scribeva-content] table").first();
  const headers = table.locator("th");
  await expect(headers.first()).toHaveAttribute("draggable", "true");
  const originalFirst = await headers.first().textContent();
  const originalSecond = await headers.nth(1).textContent();
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await headers.first().dispatchEvent("dragstart", { dataTransfer });
  await headers.nth(1).dispatchEvent("dragover", { dataTransfer });
  await headers.nth(1).dispatchEvent("drop", { dataTransfer });
  await expect(headers.first()).toHaveText(originalSecond ?? "");
  await expect(headers.nth(1)).toHaveText(originalFirst ?? "");
});

test("opens the standalone file build without CORS and localizes its document", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  const fileUrl = pathToFileURL(
    resolve(process.cwd(), "demo/index.html"),
  ).href;
  await page.goto(fileUrl);

  await expect(page.locator(".scribeva")).toBeVisible();
  await expect(page.locator("[data-scribeva-content]")).toContainText(
    "營運簡報",
  );

  await page.locator("#site-locale").selectOption("en");
  await expect(page.getByRole("heading", { name: /Keep content/ })).toBeVisible();
  await expect(page.locator("[data-scribeva-content]")).toContainText(
    "OPERATIONS BRIEF",
  );

  await page.locator("#site-locale").selectOption("ja");
  await expect(page.locator("[data-scribeva-content]")).toContainText("運用概要");
  expect(browserErrors).toEqual([]);
});

test("publishes complete product SEO metadata", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /HTML editor|HTML 編輯器|HTML エディター/,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /og-scribeva\.png$/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://lianyongli.github.io/scribeva-editor/",
  );
  await expect(page.locator('meta[name="googlebot"]')).toHaveAttribute(
    "content",
    /index,follow/,
  );
  await expect(page.locator('link[rel="alternate"][type="text/plain"]')).toHaveAttribute(
    "href",
    /llms\.txt$/,
  );
  const structuredData = await page
    .locator("#structured-data")
    .textContent();
  const graph = JSON.parse(structuredData ?? "{}")["@graph"] as Array<{ "@type": string }>;
  expect(graph.map((item) => item["@type"])).toEqual(
    expect.arrayContaining(["WebSite", "WebPage", "SoftwareApplication", "Organization"]),
  );
  await page.locator("#site-locale").selectOption("en");
  const localizedPage = JSON.parse(await page.locator("#structured-data").textContent() ?? "{}")["@graph"]
    .find((item: { "@type": string }) => item["@type"] === "WebPage");
  expect(localizedPage.inLanguage).toBe("en");
});

test("matches the desktop visual baseline", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Chromium owns the pixel baseline.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/");

  await expect(page).toHaveScreenshot("scribeva-editor.png", {
    fullPage: true,
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });
});
