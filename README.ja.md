# Scribeva Editor

[繁體中文](https://github.com/Lian0123/scribeva-editor/README.zh-TW.md) · [English](https://github.com/Lian0123/scribeva-editor/README.md) · **日本語**

Scribeva は、フレームワークに依存しない MIT ライセンスのエンタープライズ
HTML エディターです。Word 風のリボン UI を提供し、実行時依存はゼロです。

## インストール

```bash
npm install scribeva-editor
```

```ts
import { createEditor } from "scribeva-editor";
import "scribeva-editor/styles.css";

const editor = createEditor(document.querySelector("#editor")!, {
  locale: "ja",
  theme: "light",
  initialHTML: "<h1>こんにちは</h1><p>移植可能な HTML。</p>",
  onChange: ({ html, json }) => console.log(html, json),
});
```

## 主な機能

- ホーム、挿入、表示、HTML 編集リボンと文書キャンバス
- 見出し、書式、リスト、色、配置、インデント、行間
- 表の行／列操作、見出し行、結合／分割、垂直配置、上／下／左／右／左右／上下／
  すべて／なしの罫線、色、セル背景
- 行番号、行／列表示、インデント、折り返し、適用／復元、Ctrl/Command+S を備えた
  サニタイズ済み HTML ソースモード
- リンク、画像、Blob 画像、絵文字、区切り線、プレビュー
- HTML 許可リスト、Office 貼り付けの正規化、HTML／JSON 変換
- Undo／redo、キーボードショートカット、IME、クリップボード
- 繁体字中国語、英語、日本語とライト／ダーク／システムテーマ
- Custom Element、プラグイン、カスタムコマンド

## Blob 画像

```ts
const objectURL = editor.insertImageBlob(file, "製品画像");
```

Blob URL はローカルプレビュー専用です。Scribeva は `destroy()` 時に作成した
URL を解放します。文書を保存する前に、画像をアプリケーションのストレージへ
アップロードし、永続 URL に置き換えてください。

## Content Security Policy

Scribeva はリモートスクリプト、フォント、ワーカー、フレーム、通信を必要と
しません。次のポリシーをアプリケーションに合わせて調整してください。

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

文字色、配置、フォント、サイズ、表セルの垂直配置は、許可リストで管理された
インライン style を使用するため、`style-src-attr 'unsafe-inline'` が必要です。
Blob 画像を使わない場合は `img-src` から `blob:` を削除できます。導入前に
Report-Only で確認し、サーバー側でも HTML を再度サニタイズしてください。

## フォントライセンス

名前付きフォントスタックには、オープンソースで商用利用可能な Noto Sans、
Noto Serif、Noto Sans Mono のみを使用します。絵文字フォントを自社配信する
場合は Noto Color Emoji を推奨します。フォントファイルは同梱しません。
自社配信する場合は SIL Open Font License 1.1 を保持してください。

## 公式サイトと GitHub Pages

`demo/` は、3 言語の公式サイト兼ライブデモです。相対パスでビルドされるため、
GitHub Pages のリポジトリサブパスで利用できます。

```bash
npm run build:site
npm run preview:site
```

同梱の `.github/workflows/pages.yml` が検証、ビルド、Pages 配信を行います。

`npm run build:site` は `demo/assets/` に classic browser bundle も生成します。
ビルド後は `demo/index.html` を `file://` で直接開くことができ、TypeScript
読み込みや ES module CORS は発生しません。GSAP は公式サイト専用のビルド時
依存で、npm パッケージには含まれません。詳細は
[THIRD_PARTY_NOTICES.md](https://github.com/Lian0123/scribeva-editor/THIRD_PARTY_NOTICES.md) を参照してください。

## 開発と検証

```bash
nvm use
npm install
npm run check
npm run test:coverage
npm run test:e2e
```

AI メンテナンス入口：
[docs/ai-maintenance/entry.md](https://github.com/Lian0123/scribeva-editor/docs/ai-maintenance/entry.md)

## ライセンス

[MIT](https://github.com/Lian0123/scribeva-editor/LICENSE)
