import { en } from "./en";
import { ja } from "./ja";
import { zhTW } from "./zh-TW";

export type ScribevaLocale = typeof zhTW;

const locales: Record<string, ScribevaLocale> = {
  en: en as ScribevaLocale,
  ja,
  "zh-TW": zhTW,
};

export function getLocale(name = "zh-TW"): ScribevaLocale {
  return locales[name] ?? zhTW;
}

export function registerLocale(name: string, locale: ScribevaLocale): void {
  locales[name] = locale;
}

export { en, ja, zhTW };
