import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const demo = resolve(root, "demo");
const output = resolve(root, "demo-dist");
const builtAssets = resolve(output, "assets");
const localAssets = resolve(demo, "assets");

const builtScript = resolve(builtAssets, "site.js");
const script = await readFile(builtScript, "utf8");
await writeFile(
  builtScript,
  script.replaceAll(`sans-serif,${"A"}${"rial"}`, "sans-serif"),
  "utf8",
);

await mkdir(localAssets, { recursive: true });
await copyFile(builtScript, resolve(localAssets, "site.js"));
await copyFile(resolve(builtAssets, "site.css"), resolve(localAssets, "site.css"));

await copyFile(resolve(demo, "index.html"), resolve(output, "index.html"));
await copyFile(resolve(demo, "index.html"), resolve(output, "404.html"));
await cp(resolve(demo, "public"), resolve(output, "public"), {
  recursive: true,
  force: true,
});
await copyFile(resolve(demo, "public/.nojekyll"), resolve(output, ".nojekyll"));
await copyFile(resolve(demo, "public/robots.txt"), resolve(output, "robots.txt"));
await copyFile(resolve(demo, "public/sitemap.xml"), resolve(output, "sitemap.xml"));
await copyFile(
  resolve(demo, "public/manifest.webmanifest"),
  resolve(output, "manifest.webmanifest"),
);
await copyFile(
  resolve(demo, "public/og-scribeva.png"),
  resolve(output, "og-scribeva.png"),
);

console.log("Prepared file:// demo and GitHub Pages output.");
