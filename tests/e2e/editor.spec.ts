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
  await page.locator("[data-theme-select]").selectOption("dark");

  await expect(root).toHaveAttribute("data-theme", "dark");
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

  await page.getByRole("tab", { name: "檢視" }).click();
  await page.getByRole("button", { name: "預覽" }).click();
  await expect(page.locator(".scribeva__preview")).toBeVisible();
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
    .locator('[data-command-select="tableBorderWidth"]')
    .selectOption("3");

  await expect(firstCell).toHaveCSS("background-color", "rgb(240, 223, 200)");
  await expect(firstCell).toHaveCSS("border-top-color", "rgb(123, 79, 44)");
  await expect(firstCell).toHaveCSS("border-top-width", "3px");

  await page.locator("[data-table-borders]").selectOption("top");
  await expect(firstCell).toHaveCSS("border-top-style", "solid");
  const secondRowCell = page.locator("[data-scribeva-content] tr").nth(1).locator("td").first();
  await expect(secondRowCell).toHaveCSS("border-top-width", "0px");

  await firstCell.click();
  await page.locator("[data-table-borders]").selectOption("none");
  await expect(firstCell).toHaveCSS("border-top-width", "0px");
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
  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  expect(JSON.parse(structuredData ?? "{}")["@type"]).toBe(
    "SoftwareApplication",
  );
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
