import "./demo.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  createEditor,
  type EditorLocale,
  type ScribevaEditor,
} from "scribeva-editor";

type SiteLocale = "zh-TW" | "en" | "ja";

const host = document.querySelector<HTMLElement>("#editor");
if (!host) throw new Error("Demo host was not found.");
const editorHost = host;

const copy = {
  "zh-TW": {
    skipToEditor: "跳至編輯器",
    languageLabel: "語言",
    navPlayground: "線上體驗",
    navFeatures: "產品特色",
    navInstall: "安裝",
    readOnly: "唯讀模式",
    editMode: "開啟編輯",
    copyHTML: "複製 HTML",
    copyJSON: "複製 JSON",
    heroRail: "為產品團隊建立的內容基礎設施",
    eyebrow: "MIT 授權 · 零執行期相依",
    headlineLead: "讓內容保持",
    headlineAccent: "可攜、清楚、由你掌控。",
    intro:
      "Scribeva 是為企業產品打造的專業 HTML 編輯器：熟悉的寫作介面、可預測的輸出，以及不綁定框架的整合方式。",
    tryEditor: "立即體驗",
    viewInstall: "查看安裝方式",
    metricRuntime: "執行期相依",
    metricLanguages: "內建語言",
    metricLicense: "商用授權",
    playgroundEyebrow: "即時線上體驗",
    playgroundTitle: "直接在瀏覽器撰寫、排版與匯出。",
    playgroundBody: "每次切換語言，官網與範例文件都會同步更新。",
    editorMeta: "可編輯範例文件",
    featureEyebrow: "產品原則",
    featureTitle: "編輯體驗應該精緻，內容格式仍應保持開放。",
    feature1Title: "可攜式設計",
    feature1Body: "只安裝一個 npm 套件，即可整合至現代化 Web 技術棧。",
    feature2Title: "安全內容管線",
    feature2Body: "HTML allowlist、貼上正規化與可預測的序列化輸出。",
    feature3Title: "企業級介面",
    feature3Body: "Ribbon、主題、鍵盤工作流與完整響應式設計。",
    installEyebrow: "單一套件，不綁框架",
    installTitle: "幾分鐘內加入完整編輯器。",
    installBody:
      "包含 ESM、CommonJS、TypeScript 型別、CSS、語系與選用的 Custom Element。",
    copyCommand: "複製",
    securityEyebrow: "安全優先設計",
    securityTitle: "不依賴專有雲端的可攜內容。",
    securityBody: "安全 HTML、受控 URL、Blob 圖片與完整 CSP 部署指南。",
    footer: "MIT 授權，為重視資料所有權與控制權的產品打造。",
    htmlCopied: "HTML 已複製",
    jsonCopied: "JSON 已複製",
    commandCopied: "安裝指令已複製",
    readOnlyOn: "已切換為唯讀模式",
    readOnlyOff: "已開啟編輯",
    editorAria: "Scribeva 編輯器繁體中文範例",
  },
  en: {
    skipToEditor: "Skip to editor",
    languageLabel: "Language",
    navPlayground: "Playground",
    navFeatures: "Product",
    navInstall: "Install",
    readOnly: "Read only",
    editMode: "Edit document",
    copyHTML: "Copy HTML",
    copyJSON: "Copy JSON",
    heroRail: "Content infrastructure for product teams",
    eyebrow: "MIT LICENSED · ZERO RUNTIME DEPENDENCIES",
    headlineLead: "Keep content",
    headlineAccent: "portable, legible, and yours.",
    intro:
      "Scribeva is a professional HTML editor for enterprise products: a familiar writing surface, deterministic output, and integration without framework lock-in.",
    tryEditor: "Try the editor",
    viewInstall: "View installation",
    metricRuntime: "runtime dependencies",
    metricLanguages: "built-in languages",
    metricLicense: "commercial license",
    playgroundEyebrow: "LIVE PLAYGROUND",
    playgroundTitle: "Write, format, and export directly in the browser.",
    playgroundBody:
      "Switching language updates both the website and the example document.",
    editorMeta: "EDITABLE EXAMPLE DOCUMENT",
    featureEyebrow: "PRODUCT PRINCIPLES",
    featureTitle:
      "The editing experience should feel refined while the content format stays open.",
    feature1Title: "Portable by design",
    feature1Body: "Install one npm package and use it with any modern web stack.",
    feature2Title: "Safe content pipeline",
    feature2Body:
      "Allowlisted HTML, normalized paste, and predictable serialization.",
    feature3Title: "Enterprise-ready UI",
    feature3Body:
      "Ribbon commands, themes, keyboard workflows, and responsive layout.",
    installEyebrow: "ONE PACKAGE. NO FRAMEWORK LOCK-IN.",
    installTitle: "Add a complete editor in minutes.",
    installBody:
      "Scribeva ships ESM, CommonJS, TypeScript declarations, CSS, locales, and an optional Custom Element.",
    copyCommand: "Copy",
    securityEyebrow: "SECURITY BY DESIGN",
    securityTitle: "Portable content without a proprietary cloud.",
    securityBody:
      "Sanitized HTML, controlled URL schemes, local Blob images, and a documented CSP deployment path.",
    footer: "MIT licensed. Built for products that need ownership and control.",
    htmlCopied: "HTML copied",
    jsonCopied: "JSON copied",
    commandCopied: "Install command copied",
    readOnlyOn: "Read-only mode enabled",
    readOnlyOff: "Editing enabled",
    editorAria: "Scribeva editor English example",
  },
  ja: {
    skipToEditor: "エディターへ移動",
    languageLabel: "言語",
    navPlayground: "デモ",
    navFeatures: "製品",
    navInstall: "導入",
    readOnly: "読み取り専用",
    editMode: "編集を開始",
    copyHTML: "HTML をコピー",
    copyJSON: "JSON をコピー",
    heroRail: "プロダクトチームのためのコンテンツ基盤",
    eyebrow: "MIT ライセンス · 実行時依存ゼロ",
    headlineLead: "コンテンツを",
    headlineAccent: "移植可能で、明瞭で、自分たちのものに。",
    intro:
      "Scribeva は企業製品向けのプロフェッショナル HTML エディターです。使い慣れた執筆環境、予測可能な出力、フレームワークに縛られない統合を提供します。",
    tryEditor: "エディターを試す",
    viewInstall: "導入方法を見る",
    metricRuntime: "実行時依存",
    metricLanguages: "標準言語",
    metricLicense: "商用ライセンス",
    playgroundEyebrow: "ライブデモ",
    playgroundTitle: "ブラウザで直接、作成・整形・エクスポート。",
    playgroundBody: "言語を切り替えると、サイトとサンプル文書が同時に変わります。",
    editorMeta: "編集可能なサンプル文書",
    featureEyebrow: "製品原則",
    featureTitle:
      "洗練された編集体験と、開かれたコンテンツ形式を両立します。",
    feature1Title: "移植性を重視",
    feature1Body:
      "npm パッケージを一つ追加するだけで、最新の Web 環境に統合できます。",
    feature2Title: "安全なコンテンツ処理",
    feature2Body:
      "許可リスト方式の HTML、貼り付けの正規化、予測可能な出力。",
    feature3Title: "エンタープライズ UI",
    feature3Body:
      "リボン、テーマ、キーボード操作、レスポンシブレイアウト。",
    installEyebrow: "一つのパッケージ。フレームワーク非依存。",
    installTitle: "数分で完全なエディターを追加。",
    installBody:
      "ESM、CommonJS、TypeScript 型、CSS、ロケール、Custom Element を提供します。",
    copyCommand: "コピー",
    securityEyebrow: "セキュリティを中心に設計",
    securityTitle: "独自クラウドに依存しない移植可能なコンテンツ。",
    securityBody: "安全な HTML、制御された URL、Blob 画像、CSP 導入ガイド。",
    footer: "MIT ライセンス。所有権と制御を重視する製品のために。",
    htmlCopied: "HTML をコピーしました",
    jsonCopied: "JSON をコピーしました",
    commandCopied: "インストールコマンドをコピーしました",
    readOnlyOn: "読み取り専用モード",
    readOnlyOff: "編集を有効にしました",
    editorAria: "Scribeva エディター日本語サンプル",
  },
} as const;

const seo = {
  "zh-TW": {
    title: "Scribeva Editor｜可攜式專業 HTML 編輯器",
    description:
      "Scribeva Editor 是零執行期相依、MIT 授權的企業級 HTML 編輯器，提供專業 Ribbon 介面、安全內容管線與可攜式 HTML。",
    social:
      "零執行期相依、MIT 授權，為企業產品打造的可攜式寫作基礎設施。",
    locale: "zh_TW",
  },
  en: {
    title: "Scribeva Editor | Portable enterprise HTML editor",
    description:
      "A zero-runtime-dependency, MIT-licensed enterprise HTML editor with a professional Ribbon UI, safe content pipeline, and portable HTML.",
    social:
      "Portable writing infrastructure with zero runtime dependencies and an MIT license.",
    locale: "en_US",
  },
  ja: {
    title: "Scribeva Editor｜移植可能な業務向け HTML エディター",
    description:
      "実行時依存ゼロ、MIT ライセンス。プロフェッショナルなリボン UI、安全なコンテンツ処理、移植可能な HTML を提供します。",
    social:
      "実行時依存ゼロ、MIT ライセンスの移植可能なライティング基盤。",
    locale: "ja_JP",
  },
} as const;

const editorDocuments: Record<SiteLocale, string> = {
  "zh-TW": `
    <p style="color: #2e7657; font-family: 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans', sans-serif; font-size: 13px"><strong>營運簡報 · 2026 Q3</strong></p>
    <h1>讓內容成為<br>可攜的產品資產。</h1>
    <p>Scribeva 為企業產品團隊提供可靠編輯、清楚授權與精緻的寫作體驗，文件不被框架或專有服務綁定。</p>
    <blockquote><p>好的工具不搶走注意力；它讓每一次編輯都能留下乾淨、可預測的內容。</p></blockquote>
    <h2>本季內容營運摘要</h2>
    <table style="border-color: #315f4c; border-style: solid; border-width: 2px"><thead><tr><th style="background-color: #e4eee8; border-color: #315f4c; border-style: solid; border-width: 2px">項目</th><th style="background-color: #e4eee8; border-color: #315f4c; border-style: solid; border-width: 2px">狀態</th></tr></thead><tbody><tr><td style="border-color: #315f4c; border-style: solid; border-width: 2px">產品文件</td><td style="border-color: #315f4c; border-style: solid; border-width: 2px">已發布</td></tr><tr><td style="border-color: #315f4c; border-style: solid; border-width: 2px">知識內容</td><td style="border-color: #315f4c; border-style: solid; border-width: 2px">審閱中</td></tr></tbody></table>
    <ul><li><strong>MIT 授權</strong>，可商業使用</li><li><strong>零 runtime dependencies</strong></li><li><strong>繁體中文、英文與日文</strong></li></ul>`,
  en: `
    <p style="color: #2e7657; font-family: 'Noto Sans', sans-serif; font-size: 13px"><strong>OPERATIONS BRIEF · 2026 Q3</strong></p>
    <h1>Make content a<br>portable product asset.</h1>
    <p>Scribeva gives enterprise product teams dependable editing, clear licensing, and a refined writing experience—without framework or service lock-in.</p>
    <blockquote><p>Good tools do not compete for attention. They leave every edit as clean, predictable content.</p></blockquote>
    <h2>Quarterly content operations</h2>
    <table style="border-color: #315f4c; border-style: solid; border-width: 2px"><thead><tr><th style="background-color: #e4eee8; border-color: #315f4c; border-style: solid; border-width: 2px">Workstream</th><th style="background-color: #e4eee8; border-color: #315f4c; border-style: solid; border-width: 2px">Status</th></tr></thead><tbody><tr><td style="border-color: #315f4c; border-style: solid; border-width: 2px">Product documentation</td><td style="border-color: #315f4c; border-style: solid; border-width: 2px">Published</td></tr><tr><td style="border-color: #315f4c; border-style: solid; border-width: 2px">Knowledge content</td><td style="border-color: #315f4c; border-style: solid; border-width: 2px">In review</td></tr></tbody></table>
    <ul><li><strong>MIT licensed</strong> for commercial use</li><li><strong>Zero runtime dependencies</strong></li><li><strong>Traditional Chinese, English, and Japanese</strong></li></ul>`,
  ja: `
    <p style="color: #2e7657; font-family: 'Noto Sans JP', 'Noto Sans', sans-serif; font-size: 13px"><strong>運用概要 · 2026 Q3</strong></p>
    <h1>コンテンツを<br>移植可能な製品資産へ。</h1>
    <p>Scribeva は企業のプロダクトチームに、信頼できる編集、明確なライセンス、洗練された執筆体験を提供します。</p>
    <blockquote><p>優れたツールは注意を奪いません。すべての編集を、きれいで予測可能なコンテンツとして残します。</p></blockquote>
    <h2>四半期コンテンツ運用</h2>
    <table style="border-color: #315f4c; border-style: solid; border-width: 2px"><thead><tr><th style="background-color: #e4eee8; border-color: #315f4c; border-style: solid; border-width: 2px">項目</th><th style="background-color: #e4eee8; border-color: #315f4c; border-style: solid; border-width: 2px">状況</th></tr></thead><tbody><tr><td style="border-color: #315f4c; border-style: solid; border-width: 2px">製品ドキュメント</td><td style="border-color: #315f4c; border-style: solid; border-width: 2px">公開済み</td></tr><tr><td style="border-color: #315f4c; border-style: solid; border-width: 2px">ナレッジコンテンツ</td><td style="border-color: #315f4c; border-style: solid; border-width: 2px">レビュー中</td></tr></tbody></table>
    <ul><li><strong>MIT ライセンス</strong></li><li><strong>実行時依存ゼロ</strong></li><li><strong>繁体字中国語、英語、日本語</strong></li></ul>`,
};

if (window.location.protocol !== "file:") {
  const manifest = document.createElement("link");
  manifest.rel = "manifest";
  manifest.href = "./manifest.webmanifest";
  document.head.append(manifest);
}

const toast = document.querySelector<HTMLElement>("#toast");
const localeSelect = document.querySelector<HTMLSelectElement>("#site-locale");
let toastTimer = 0;
let siteLocale: SiteLocale = "zh-TW";
let readOnly = false;
let editor: ScribevaEditor;

function isSiteLocale(value: string | null): value is SiteLocale {
  return value === "zh-TW" || value === "en" || value === "ja";
}

function getStoredLocale(): SiteLocale | null {
  try {
    const value = localStorage.getItem("scribeva-site-locale");
    return isSiteLocale(value) ? value : null;
  } catch {
    return null;
  }
}

function storeLocale(locale: SiteLocale): void {
  try {
    localStorage.setItem("scribeva-site-locale", locale);
  } catch {
    // file:// privacy modes may disable storage; the current session still works.
  }
}

function notify(message: string): void {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function mountEditor(locale: SiteLocale): void {
  editor?.destroy();
  editor = createEditor(editorHost, {
    locale: locale as EditorLocale,
    theme: "light",
    initialHTML: editorDocuments[locale],
    ariaLabel: copy[locale].editorAria,
  });
  editor.setReadOnly(readOnly);
}

function setMeta(selector: string, value: string): void {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", value);
}

function applyLocale(locale: SiteLocale): void {
  siteLocale = locale;
  document.documentElement.lang =
    locale === "zh-TW" ? "zh-Hant" : locale === "ja" ? "ja" : "en";
  document.documentElement.dataset.initialLocale = locale;
  document.title = seo[locale].title;
  setMeta('meta[name="description"]', seo[locale].description);
  setMeta('meta[property="og:title"]', seo[locale].title);
  setMeta('meta[property="og:description"]', seo[locale].social);
  setMeta('meta[property="og:locale"]', seo[locale].locale);
  setMeta('meta[name="twitter:title"]', seo[locale].title);
  setMeta('meta[name="twitter:description"]', seo[locale].social);

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n as keyof (typeof copy)["en"];
    element.textContent = copy[locale][key];
  });

  const readOnlyButton =
    document.querySelector<HTMLButtonElement>("#readonly-toggle");
  if (readOnlyButton) {
    readOnlyButton.textContent = readOnly
      ? copy[locale].editMode
      : copy[locale].readOnly;
  }
  if (localeSelect) localeSelect.value = locale;
  mountEditor(locale);
  storeLocale(locale);
}

function initAnimations(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ScrollTrigger);
  const progress = document.createElement("span");
  progress.className = "demo-scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.append(progress);

  const hero = gsap.timeline({ defaults: { ease: "power3.out" } });
  hero
    .from(".demo-header", { yPercent: -100, duration: 0.65 })
    .from(
      "[data-reveal]",
      { y: 30, opacity: 0, duration: 0.85, stagger: 0.08 },
      "-=0.2",
    )
    .from(
      ".demo-document-sheet",
      {
        x: 110,
        y: 35,
        rotate: 5,
        scale: 0.94,
        duration: 1.25,
        ease: "expo.out",
      },
      "-=0.9",
    )
    .from(
      ".demo-sheet-kicker, .demo-sheet-title, .demo-sheet-grid span",
      {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 0.55,
        stagger: 0.055,
      },
      "-=0.7",
    );
  gsap.to(".demo-document-sheet", {
    yPercent: -9,
    rotate: -1,
    ease: "none",
    scrollTrigger: {
      trigger: ".demo-hero",
      start: "top top",
      end: "bottom top",
      scrub: 0.8,
    },
  });
  gsap.to(progress, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: {
      start: 0,
      end: "max",
      scrub: 0.15,
    },
  });
  gsap.utils.toArray<HTMLElement>("[data-scroll-reveal]").forEach((section) => {
    gsap.from(section.children, {
      y: 42,
      opacity: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: "power2.out",
      immediateRender: false,
      scrollTrigger: {
        trigger: section,
        start: "top 88%",
        once: true,
      },
    });
  });
  gsap.from(".demo-editor-meta span", {
    y: -10,
    opacity: 0,
    duration: 0.65,
    stagger: 0.08,
    ease: "power2.out",
    immediateRender: false,
    scrollTrigger: {
      trigger: ".demo-editor-meta",
      start: "top 82%",
      once: true,
    },
  });
  gsap.from(".demo-details article", {
    x: 28,
    opacity: 0,
    duration: 0.65,
    stagger: 0.11,
    ease: "power2.out",
    immediateRender: false,
    scrollTrigger: {
      trigger: ".demo-details",
      start: "top 78%",
      once: true,
    },
  });
}

document.querySelector("#copy-html")?.addEventListener("click", async () => {
  await copyText(editor.getHTML());
  notify(copy[siteLocale].htmlCopied);
});

document.querySelector("#copy-json")?.addEventListener("click", async () => {
  await copyText(JSON.stringify(editor.getJSON(), null, 2));
  notify(copy[siteLocale].jsonCopied);
});

document.querySelector("#copy-install")?.addEventListener("click", async () => {
  await copyText("npm install scribeva-editor");
  notify(copy[siteLocale].commandCopied);
});

document.querySelector("#readonly-toggle")?.addEventListener("click", (event) => {
  readOnly = !readOnly;
  editor.setReadOnly(readOnly);
  (event.currentTarget as HTMLButtonElement).textContent = readOnly
    ? copy[siteLocale].editMode
    : copy[siteLocale].readOnly;
  notify(readOnly ? copy[siteLocale].readOnlyOn : copy[siteLocale].readOnlyOff);
});

localeSelect?.addEventListener("change", () => {
  applyLocale(localeSelect.value as SiteLocale);
});

document.querySelectorAll<HTMLElement>("[data-scroll]").forEach((control) => {
  control.addEventListener("click", () => {
    const target = document.getElementById(control.dataset.scroll ?? "top");
    target?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
    if (control.classList.contains("demo-skip-link")) {
      target
        ?.querySelector<HTMLElement>("[data-scribeva-content]")
        ?.focus({ preventScroll: true });
    }
  });
});

const queryLocale = new URLSearchParams(window.location.search).get("lang");
const browserLocale: SiteLocale = navigator.language.startsWith("ja")
  ? "ja"
  : navigator.language.startsWith("zh")
    ? "zh-TW"
    : "en";
const initialAttribute = document.documentElement.dataset.initialLocale ?? null;
siteLocale = isSiteLocale(queryLocale)
  ? queryLocale
  : getStoredLocale() ??
    (isSiteLocale(initialAttribute) ? initialAttribute : browserLocale);

applyLocale(siteLocale);
requestAnimationFrame(initAnimations);
