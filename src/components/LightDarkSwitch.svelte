<script lang="ts">
import { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants.ts";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import {
	applyThemeToDocument,
	getStoredTheme,
	setTheme,
} from "@utils/setting-utils.ts";
import { onMount } from "svelte";
import type { LIGHT_DARK_MODE } from "@/types/config.ts";

const seq: LIGHT_DARK_MODE[] = [LIGHT_MODE, DARK_MODE]; // 只保留黑白两色
let mode: LIGHT_DARK_MODE = $state(DARK_MODE);

let isInitialized = false;

function initializeThemeSwitch() {
	if (isInitialized) return;

	let storedTheme = getStoredTheme();

	// 如果存储的是系统模式，转换为暗色模式
	if (storedTheme === AUTO_MODE) {
		storedTheme = DARK_MODE;
		setTheme(DARK_MODE);
	}

	mode = storedTheme;
	isInitialized = true;
	console.log('🎨 主题切换器已初始化，当前模式:', mode);
}

onMount(() => {
	// 确保在客户端环境中初始化
	if (typeof window === 'undefined') return;

	initializeThemeSwitch();

	// 监听重新初始化事件
	const handleReinit = () => {
		if (import.meta.env.DEV) {
			console.log('🎨 收到主题切换器重新初始化事件');
		}
		isInitialized = false;
		setTimeout(() => {
			initializeThemeSwitch();
		}, 10); // 小延迟确保DOM更新完成
	};

	// 监听自定义重新初始化事件
	const setupThemeButton = () => {
		const themeButton = document.getElementById('scheme-switch');
		if (themeButton) {
			// 移除旧的事件监听器，避免重复绑定
			themeButton.removeEventListener('theme-switch-reinit', handleReinit);
			themeButton.addEventListener('theme-switch-reinit', handleReinit);
			if (import.meta.env.DEV) {
				console.log('🎨 主题切换器事件监听器已绑定');
			}
			return themeButton;
		}
		return null;
	};

	// 多次尝试绑定，确保在CF环境中也能工作
	let themeButton = setupThemeButton();
	if (!themeButton) {
		setTimeout(() => {
			themeButton = setupThemeButton();
		}, 100);
	}
	if (!themeButton) {
		setTimeout(() => {
			themeButton = setupThemeButton();
		}, 500);
	}

	// 监听Swup页面切换事件，重新初始化组件
	const setupSwupListeners = () => {
		if (window.swup && window.swup.hooks) {
			if (import.meta.env.DEV) {
				console.log('🎨 设置主题切换器Swup事件监听');
			}

			// 页面切换后重新初始化
			window.swup.hooks.on('page:view', () => {
				if (import.meta.env.DEV) {
					console.log('🎨 Swup页面切换完成，重新初始化主题切换器');
				}
				// 延迟重新初始化，确保DOM完全更新
				setTimeout(() => {
					handleReinit();
				}, 50);
			});

			// 内容替换时也重新初始化
			window.swup.hooks.on('content:replace', () => {
				if (import.meta.env.DEV) {
					console.log('🎨 Swup内容替换，重新初始化主题切换器');
				}
				setTimeout(() => {
					handleReinit();
				}, 100);
			});
		}
	};

	// 如果Swup已经加载，立即设置监听器
	if (window.swup) {
		setupSwupListeners();
	} else {
		// 否则等待Swup加载完成
		document.addEventListener('swup:enable', setupSwupListeners);
	}

	// 定期检查按钮是否存在，如果消失则重新初始化
	const checkButtonExistence = () => {
		const themeButton = document.getElementById('scheme-switch');
		if (!themeButton && isInitialized) {
			if (import.meta.env.DEV) {
				console.log('🎨 检测到主题切换按钮消失，重新初始化');
			}
			isInitialized = false;
			setTimeout(() => {
				initializeThemeSwitch();
			}, 100);
		}
	};

	// 每5秒检查一次按钮是否存在
	const existenceCheckInterval = setInterval(checkButtonExistence, 5000);

	// 清理函数
	return () => {
		clearInterval(existenceCheckInterval);
		const themeButton = document.getElementById('scheme-switch');
		if (themeButton) {
			themeButton.removeEventListener('theme-switch-reinit', handleReinit);
		}
	};
});

function switchScheme(newMode: LIGHT_DARK_MODE) {
	if (import.meta.env.DEV) {
		console.log('🎨 应用新主题:', newMode);
	}
	mode = newMode;
	setTheme(newMode);

	// 强制更新UI状态
	setTimeout(() => {
		mode = newMode;
	}, 10);
}

// 移除重复的toggleScheme函数，使用toggleTheme代替

// 简化为直接切换主题，不需要面板
function toggleTheme(event) {
	// 阻止事件冒泡，确保事件正确处理
	if (event) {
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
	}

	// 确保组件已初始化
	if (!isInitialized) {
		initializeThemeSwitch();
	}

	let i = 0;
	for (; i < seq.length; i++) {
		if (seq[i] === mode) {
			break;
		}
	}
	const newMode = seq[(i + 1) % seq.length];
	if (import.meta.env.DEV) {
		console.log('🎨 直接切换主题:', mode, '->', newMode);
	}
	switchScheme(newMode);

	// 添加按钮点击反馈
	const themeButton = document.getElementById('scheme-switch');
	if (themeButton) {
		themeButton.style.transform = 'scale(0.95)';
		setTimeout(() => {
			themeButton.style.transform = 'scale(1)';
		}, 30); // 调整为30ms，与主题切换动画保持一致
	}
}
</script>

<!-- 简化的黑白主题切换按钮 -->
<button aria-label="Toggle Theme" class="relative btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90" id="scheme-switch"
        on:click={toggleTheme}
        on:touchstart|preventDefault={(e) => {
            e.stopPropagation();
            toggleTheme();
        }}
        title="点击切换主题: {mode === LIGHT_MODE ? '切换到暗色' : '切换到亮色'}"
>
    <div class="absolute" class:opacity-0={mode !== LIGHT_MODE}>
        <Icon icon="material-symbols:wb-sunny-outline-rounded" class="text-[1.25rem]"></Icon>
    </div>
    <div class="absolute" class:opacity-0={mode !== DARK_MODE}>
        <Icon icon="material-symbols:dark-mode-outline-rounded" class="text-[1.25rem]"></Icon>
    </div>
</button>
