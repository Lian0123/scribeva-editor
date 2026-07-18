# Scribeva Editor

**繁體中文** · [English](https://github.com/Lian0123/scribeva-editor/README.md) · [日本語](https://github.com/Lian0123/scribeva-editor/README.ja.md)

Scribeva 是 framework-independent、MIT 授權的企業級 HTML 編輯器，提供
Word-like Ribbon 介面，並維持零 runtime dependencies。

## 安裝

```bash
npm install scribeva-editor
```

```ts
import { createEditor } from "scribeva-editor";
import "scribeva-editor/styles.css";

const editor = createEditor(document.querySelector("#editor")!, {
  locale: "zh-TW",
  theme: "light",
  initialHTML: "<h1>您好</h1><p>可攜式 HTML 內容。</p>",
  onChange: ({ html, json }) => console.log(html, json),
});
```

## 主要能力

- 常用、插入、檢視、HTML 編輯 Ribbon 與企業級文件畫布
- 文字格式、標題、清單、對齊、縮排、顏色與行距
- 表格列／欄操作、標題列、合併拆分、垂直對齊、上／下／左／右／左右／上下／
  全部／無框線、框線樣式／色彩與填色
- 具行號、行欄狀態、縮排、自動換行、套用／還原與 Ctrl/Command+S 的安全
  HTML 原始碼模式
- 連結、圖片、Blob 圖片、Emoji、分隔線與文件預覽
- HTML allowlist sanitizer、Office 貼上清理與 HTML／JSON 轉換
- Undo／redo、鍵盤快捷鍵、clipboard 與 IME 輸入
- 繁體中文、英文、日文；淺色、深色、系統主題
- Imperative API、Custom Element 與自訂 command

## Blob 圖片

```ts
const objectURL = editor.insertImageBlob(file, "產品截圖");
```

Blob URL 只適合本機預覽，重新載入後不會繼續有效。Scribeva 會在
`destroy()` 時釋放由它建立的 Blob URL。持久化文件前，應先把圖片上傳到應用程式
儲存空間並將 `src` 換成永久 URL。

## Content Security Policy

Scribeva 不需要遠端 script、font、worker、frame 或網路連線。可從以下 CSP
開始，再與應用程式既有政策整合：

```http
Content-Security-Policy:
  default-src 'none';
  script-src 'self';
  style-src-elem 'self';
  style-src-attr 'unsafe-inline';
  img-src 'self' https: blob:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'none';
  form-action 'self';
  frame-ancestors 'none';
```

文字色彩、對齊、字型、字級與表格垂直對齊會使用經 allowlist 過濾的 inline
style，因此需要 `style-src-attr 'unsafe-inline'`。`style-src-elem` 仍可限制為
`'self'`。只有使用 Blob 圖片時才需要 `img-src blob:`。正式啟用前請先用
Report-Only 測試，後端仍必須再次 sanitize 與檢查權限。

## 字型授權

程式的具名字型堆疊只使用開源可商用的 Noto Sans、Noto Serif 與 Noto Sans
Mono；若需要自行託管 emoji 字型，則建議使用 Noto Color Emoji。套件不下載或
重新散布字型檔。若需要跨平台一致顯示，請自行託管 Noto 字型並保留 SIL Open
Font License 1.1 聲明。

## 官網與 GitHub Pages

`demo/` 同時是三語官網與可操作 playground。靜態輸出使用相對路徑，可部署在
GitHub Pages repository 子路徑：

```bash
npm run build:site
npm run preview:site
```

`.github/workflows/pages.yml` 會執行品質檢查、建立 `demo-dist/` 並部署 Pages。

`npm run build:site` 也會在 `demo/assets/` 產生 classic browser bundle。完成
建置後可直接以 `file://` 開啟 `demo/index.html`，不需要伺服器，也不會載入
TypeScript 或觸發 ES module CORS。官網動畫使用建置期 GSAP，相依不會進入 npm
套件；詳見 [THIRD_PARTY_NOTICES.md](https://github.com/Lian0123/scribeva-editor/THIRD_PARTY_NOTICES.md)。

## 開發與驗證

```bash
nvm use
npm install
npm run check
npm run test:coverage
npm run test:e2e
```

AI 維護入口位於
[docs/ai-maintenance/entry.md](https://github.com/Lian0123/scribeva-editor/docs/ai-maintenance/entry.md)。

## 授權

[MIT](https://github.com/Lian0123/scribeva-editor/LICENSE)
