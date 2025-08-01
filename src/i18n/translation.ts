import type I18nKey from "./i18nKey";
import { zh_CN } from "./languages/zh_CN";

export type Translation = {
	[K in I18nKey]: string;
};

// 固定使用中文翻译
const translation = zh_CN;

export function i18n(key: I18nKey): string {
	return translation[key];
}
