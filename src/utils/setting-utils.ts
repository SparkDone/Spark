import {
	AUTO_MODE,
	DARK_MODE,
	DEFAULT_THEME,
	LIGHT_MODE,
} from "@constants/constants.ts";
import { expressiveCodeConfig } from "@/config";
import type { LIGHT_DARK_MODE } from "@/types/config";

export function getDefaultHue(): number {
	const fallback = "260";
	const configCarrier = document.getElementById("config-carrier");
	return Number.parseInt(configCarrier?.dataset.hue || fallback);
}

export function getHue(): number {
	const stored = localStorage.getItem("hue");
	return stored ? Number.parseInt(stored) : getDefaultHue();
}

export function setHue(hue: number): void {
	localStorage.setItem("hue", String(hue));
	const r = document.querySelector(":root") as HTMLElement;
	if (!r) {
		return;
	}
	r.style.setProperty("--hue", String(hue));
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE) {
	const html = document.documentElement;

	// 检查是否需要切换（避免不必要的动画）
	const isDarkMode = html.classList.contains("dark");
	const isLightMode = html.classList.contains("light");
	const shouldBeDark = theme === DARK_MODE;

	if ((isDarkMode && shouldBeDark) || (isLightMode && !shouldBeDark)) {
		// 主题没有变化，只更新data-theme属性
		html.setAttribute("data-theme", expressiveCodeConfig.theme);
		return;
	}

	// 添加过渡动画类
	html.classList.add('theme-transitioning');

	// 使用requestAnimationFrame确保动画流畅
	requestAnimationFrame(() => {
		switch (theme) {
			case LIGHT_MODE:
				html.classList.remove("dark");
				html.classList.add("light");
				break;
			case DARK_MODE:
				html.classList.remove("light");
				html.classList.add("dark");
				break;
			// 移除系统模式处理
		}

		// Set the theme for Expressive Code
		html.setAttribute("data-theme", expressiveCodeConfig.theme);

		// 动画完成后移除过渡类 - 加快速度
		setTimeout(() => {
			html.classList.remove('theme-transitioning');
		}, 30); // 调整为30ms，与CSS动画时间匹配
	});
}

// 防抖变量
let themeChangeTimeout: number | null = null;

export function setTheme(theme: LIGHT_DARK_MODE): void {
	// 清除之前的延时
	if (themeChangeTimeout) {
		clearTimeout(themeChangeTimeout);
	}

	// 立即更新localStorage
	localStorage.setItem("theme", theme);

	// 防抖应用主题（防止快速点击）- 减少延时
	themeChangeTimeout = window.setTimeout(() => {
		applyThemeToDocument(theme);
		themeChangeTimeout = null;
	}, 10); // 从20ms减少到10ms
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	const storedTheme = localStorage.getItem("theme") as LIGHT_DARK_MODE;

	// 如果没有存储的主题，设置默认为暗黑模式
	if (!storedTheme) {
		localStorage.setItem("theme", DEFAULT_THEME);
		return DEFAULT_THEME;
	}

	// 如果存储的是系统模式，转换为暗黑模式（不再支持系统模式）
	if (storedTheme === AUTO_MODE) {
		localStorage.setItem("theme", DARK_MODE);
		return DARK_MODE;
	}

	return storedTheme;
}
