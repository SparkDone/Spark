import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import swup from "@swup/astro";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components"; /* Render the custom directive content */
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive"; /* Handle directives */
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";
import remarkMath from "remark-math";
import remarkSectionize from "remark-sectionize";
import { expressiveCodeConfig } from "./src/config.ts";
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge.ts";
import { AdmonitionComponent } from "./src/plugins/rehype-component-admonition.mjs";
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { remarkExcerpt } from "./src/plugins/remark-excerpt.js";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";
import { pluginCustomCopyButton } from "./src/plugins/expressive-code/custom-copy-button.js";

// https://astro.build/config
// 根据环境选择适配器
const isCloudflare = process.env.CF_PAGES === 'true';
const adapter = isCloudflare
	? cloudflare({
		mode: "directory",
		functionPerRoute: true
	})
	: node({
		mode: "standalone"
	});

export default defineConfig({
	site: "https://sparkdone.com/", // 主站域名
	base: "/",
	trailingSlash: "ignore", // 允许有无尾部斜杠的URL
	output: "server", // 混合模式：服务器基础 + 页面级prerender
	adapter: adapter, // API路由需要适配器
	// 开发环境配置
	vite: {
		define: {
			// 在开发环境中禁用某些错误显示
			'import.meta.env.SUPPRESS_STRAPI_ERRORS': true
		}
	},
	integrations: [
		tailwind({
			nesting: true,
		}),
		swup({
			theme: false,
			animationClass: "transition-swup-",
			containers: ["#swup-container"],
			smoothScrolling: false, // 减少性能开销
			cache: true, // 启用缓存
			preload: false, // 禁用预加载，减少不必要的请求
			accessibility: {
				// 自定义 A11y 插件配置，减少 h1 警告
				headingSelector: 'h1, .sr-only h1, [role="heading"][aria-level="1"]'
			},
			updateHead: true,
			updateBodyClass: false,
			globalInstance: true,
			// 简化链接选择器
			linkSelector: 'a[href^="/"]:not([data-no-swup])',
			animateHistoryBrowsing: false, // 禁用历史浏览动画，加快后退/前进
		}),
		icon({
			include: {
				"preprocess: vitePreprocess(),": ["*"],
				"fa6-brands": ["*"],
				"fa6-regular": ["*"],
				"fa6-solid": ["*"],
			},
		}),
		expressiveCode({
			themes: [expressiveCodeConfig.theme, expressiveCodeConfig.theme],
			plugins: [
				pluginCollapsibleSections(),
				pluginLineNumbers(),
				pluginLanguageBadge(),
				pluginCustomCopyButton()
			],
			defaultProps: {
				wrap: true,
				overridesByLang: {
					'shellsession': {
						showLineNumbers: false,
					},
				},
			},
			styleOverrides: {
				codeBackground: "var(--codeblock-bg)",
				borderRadius: "0.75rem",
				borderColor: "none",
				codeFontSize: "0.875rem",
				codeFontFamily: "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
				codeLineHeight: "1.5rem",
				frames: {
					editorBackground: "var(--codeblock-bg)",
					terminalBackground: "var(--codeblock-bg)",
					terminalTitlebarBackground: "var(--codeblock-topbar-bg)",
					editorTabBarBackground: "var(--codeblock-topbar-bg)",
					editorActiveTabBackground: "none",
					editorActiveTabIndicatorBottomColor: "var(--primary)",
					editorActiveTabIndicatorTopColor: "none",
					editorTabBarBorderBottomColor: "var(--codeblock-topbar-bg)",
					terminalTitlebarBorderBottomColor: "none"
				},
				textMarkers: {
					delHue: 0,
					insHue: 180,
					markHue: 250
				}
			},
			frames: {
				showCopyToClipboardButton: false,
			}
		}),
        svelte(),
		sitemap({
			filter: (page) => {
				// 排除管理页面和 API 端点
				return !page.includes('/admin/') &&
				       !page.includes('/api/') &&
				       !page.includes('/_astro/') &&
				       !page.includes('/health');
			},
			customPages: [
				'https://sparkdone.com/',
				'https://sparkdone.com/about/',
				'https://sparkdone.com/archive/',
			],
			changefreq: 'weekly',
			priority: 0.7,
			lastmod: new Date(),
		}),
	],
	markdown: {
		remarkPlugins: [
			remarkMath,
			remarkReadingTime,
			remarkExcerpt,
			remarkGithubAdmonitionsToDirectives,
			remarkDirective,
			remarkSectionize,
			parseDirectiveNode,
		],
		rehypePlugins: [
			rehypeKatex,
			rehypeSlug,
			[
				rehypeComponents,
				{
					components: {
						github: GithubCardComponent,
						note: (x, y) => AdmonitionComponent(x, y, "note"),
						tip: (x, y) => AdmonitionComponent(x, y, "tip"),
						important: (x, y) => AdmonitionComponent(x, y, "important"),
						caution: (x, y) => AdmonitionComponent(x, y, "caution"),
						warning: (x, y) => AdmonitionComponent(x, y, "warning"),
					},
				},
			],
			[
				rehypeAutolinkHeadings,
				{
					behavior: "append",
					properties: {
						className: ["anchor"],
					},
					content: {
						type: "element",
						tagName: "span",
						properties: {
							className: ["anchor-icon"],
							"data-pagefind-ignore": true,
						},
						children: [
							{
								type: "text",
								value: "#",
							},
						],
					},
				},
			],
		],
	},
	vite: {
		optimizeDeps: {
			exclude: [
				"@resvg/resvg-js",
				"@swup/astro/serialise",
				"@swup/astro/idle",
				"@swup/astro/client/Swup",
				"@swup/astro/client/SwupA11yPlugin",
				"@swup/astro/client/SwupPreloadPlugin",
				"@swup/astro/client/SwupScrollPlugin",
				"@swup/astro/client/SwupHeadPlugin",
				"@swup/astro/client/SwupScriptsPlugin"
			],
		},
		build: {
			// 性能优化
			minify: 'esbuild',
			cssMinify: true,
			rollupOptions: {
				onwarn(warning, warn) {
					// temporarily suppress this warning
					if (
						warning.message.includes("is dynamically imported by") &&
						warning.message.includes("but also statically imported by")
					) {
						return;
					}
					warn(warning);
				},
				output: {
					// 代码分割优化
					manualChunks: {
						'vendor': ['svelte', '@astrojs/svelte'],
						'swup': ['@swup/astro'],
						'icons': ['astro-icon']
					}
				}
			},
		},
		// 开发服务器优化
		server: {
			fs: {
				strict: false
			},
			// 添加代理，解决CORS问题
			proxy: {
				'/api/strapi-uploads': {
					target: process.env.STRAPI_PUBLIC_URL || process.env.STRAPI_URL || 'https://api.sparkdone.com',
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/api\/strapi-uploads/, '/uploads'),
					configure: (proxy, _options) => {
						proxy.on('error', (err, _req, _res) => {
							console.log('🔴 代理错误:', err);
						});
						proxy.on('proxyReq', (proxyReq, req, _res) => {
							console.log('🔄 代理请求:', req.method, req.url);
						});
						proxy.on('proxyRes', (proxyRes, req, _res) => {
							console.log('✅ 代理响应:', proxyRes.statusCode, req.url);
						});
					}
				}
			},
			// Docker + Windows 文件监听优化
			watch: {
				usePolling: true,
				interval: 100,
				binaryInterval: 100,
				ignored: ['**/node_modules/**', '**/.git/**'],
				// 强制启用轮询
				awaitWriteFinish: {
					stabilityThreshold: 100,
					pollInterval: 100
				}
			}
		}
	},
});
