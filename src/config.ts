import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	// 🔧 网站基本信息 - 这些设置会被Strapi的Index Settings覆盖（如果配置了的话）
	title: "SparkDone", // 默认网站标题，可在Strapi后台的Index Settings中修改
	subtitle: "Powered by Astro & Strapi", // 默认副标题，可在Strapi后台修改
	lang: "zh_CN", // 网站语言，固定为中文
	themeColor: {
		hue: 260, // 主题色调：0-360，例如红色:0, 青色:200, 蓝紫色:250, 粉色:345
		fixed: false, // 是否隐藏主题色选择器，false=用户可以自定义主题色
	},

	// banner: {
	//	enable: false,
	//	src: "assets/images/demo-banner.png",
	//	position: "center",
	//	credit: { enable: false, text: "Hello,baby.", url: "" },
	// },

	favicon: [
		// Leave this array empty to use the default favicon
		// {
		//   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
		//   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
		//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		// }
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
			name: "搜索",
			url: "/search/",
			external: false,
		},
		{
			name: "GitHub",
			url: "https://github.com", // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "/demo-avatar.png", // 使用public目录的头像
	name: "SparkDone", // 请替换为您的姓名
	bio: "Welcome to my blog powered by Astro and Strapi.", // 请替换为您的个人简介
	links: [
		{
			name: "Twitter",
			icon: "fa6-brands:twitter", // Visit https://icones.js.org/ for icon codes
			// You will need to install the corresponding icon set if it's not already included
			// `pnpm add @iconify-json/<icon-set-name>`
			url: "https://twitter.com",
		},
		{
			name: "Steam",
			icon: "fa6-brands:steam",
			url: "https://store.steampowered.com",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
