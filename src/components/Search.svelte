<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { url } from "@utils/url-utils.ts";
import { onMount } from "svelte";
import type { SearchResult } from "@/global";

// 统一状态管理
let keyword = ""; // 统一的搜索关键词
let result: SearchResult[] = [];
let isSearching = false;
let pagefindLoaded = false;
let initialized = false;
let searchTimeout: number;
let showAllResults = false;
let maxDisplayResults = 3;
let panelVisible = false;
let lastSearchKeyword = '';

// 缓存DOM元素，避免重复查询
let searchPanel: HTMLElement | null = null;

const fakeResult: SearchResult[] = [
	{
		url: url("/"),
		meta: {
			title: "第一个搜索结果 - 测试中文",
		},
		excerpt:
			"这是一个包含 <mark>搜索关键词</mark> 的中文测试结果。",
	},
	{
		url: url("/"),
		meta: {
			title: "Second Search Result - English Test",
		},
		excerpt: "This is an English test result with <mark>search keywords</mark>.",
	},
	{
		url: url("/"),
		meta: {
			title: "第三个结果 - 混合语言测试",
		},
		excerpt: "Mixed language content with <mark>关键词</mark> and keywords.",
	},
	{
		url: url("/"),
		meta: {
			title: "Fourth Result - More Content",
		},
		excerpt: "Additional test content to demonstrate the <mark>more button</mark> functionality.",
	},
	{
		url: url("/"),
		meta: {
			title: "第五个搜索结果",
		},
		excerpt: "更多的测试内容来展示 <mark>更多按钮</mark> 的功能。",
	},
	{
		url: url("/"),
		meta: {
			title: "Sixth Search Result",
		},
		excerpt: "Even more content to test the <mark>expand/collapse</mark> feature.",
	},
];

// 优化的面板控制函数
const togglePanel = () => {
	setPanelVisibility(!panelVisible);
};

const setPanelVisibility = (show: boolean): void => {
	// 初始化时缓存DOM元素
	if (!searchPanel) {
		searchPanel = document.getElementById("search-panel");
	}

	if (!searchPanel) {
		console.error('❌ 搜索面板元素未找到');
		return;
	}

	// 避免重复设置相同状态
	if (panelVisible === show) {
		return;
	}

	panelVisible = show;

	if (show) {
		searchPanel.classList.remove("float-panel-closed");
	} else {
		searchPanel.classList.add("float-panel-closed");
	}
};

// 优化的防抖搜索函数
const debouncedSearch = (searchKeyword: string, delay: number = 500): void => {
	clearTimeout(searchTimeout);

	// 如果关键词为空，立即清空结果并隐藏面板
	if (!searchKeyword.trim()) {
		result = [];
		isSearching = false;
		setPanelVisibility(false);
		return;
	}

	// 如果关键词太短，显示面板但不搜索（允许单个字符搜索）
	if (searchKeyword.trim().length < 1) {
		result = [];
		isSearching = false;
		setPanelVisibility(true);
		return;
	}

	// 显示面板并开始搜索
	setPanelVisibility(true);

	// 延迟搜索，避免每个字符都触发搜索
	searchTimeout = setTimeout(() => {
		search(searchKeyword);
	}, delay);
};

// 优化的键盘导航处理
const handleKeydown = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') {
		// ESC键关闭搜索面板并重置状态
		setPanelVisibility(false);
		keyword = '';
		result = [];
		showAllResults = false;
		lastSearchKeyword = '';
	}
};

// 优化搜索关键词处理 - 兼容中英文
const normalizeKeyword = (keyword: string): string => {
	return keyword
		.trim()
		.toLowerCase()
		// 移除多余空格
		.replace(/\s+/g, ' ')
		// 处理中文标点符号
		.replace(/[，。！？；：""''（）【】]/g, ' ')
		// 处理英文标点符号
		.replace(/[,\.!\?;:"'\(\)\[\]]/g, ' ')
		.trim();
};

const search = async (searchKeyword: string): Promise<void> => {
	const normalizedKeyword = normalizeKeyword(searchKeyword);

	if (!normalizedKeyword) {
		setPanelVisibility(false);
		result = [];
		showAllResults = false;
		lastSearchKeyword = '';
		return;
	}

	if (!initialized) {
		return;
	}

	// 如果是新的搜索关键词，重置展开状态
	if (normalizedKeyword !== lastSearchKeyword) {
		showAllResults = false;
		lastSearchKeyword = normalizedKeyword;
	}

	isSearching = true;

	try {
		let searchResults: SearchResult[] = [];

		if (import.meta.env.PROD && pagefindLoaded && window.pagefind) {
			try {
				// 使用优化的搜索参数
				const response = await window.pagefind.search(normalizedKeyword, {
					// 提高搜索结果的相关性
					excerpt_length: 100,
					// 支持模糊匹配
					fuzzy: true,
					// 支持部分匹配
					partial: true
				});
				searchResults = await Promise.all(
					response.results.map((item) => item.data()),
				);
			} catch (pagefindError) {
				// 在生产环境中隐藏详细的WASM错误信息，只显示友好的提示
				if (import.meta.env.PROD) {
					console.log('🔍 搜索完成：未找到相关内容');
				} else {
					console.warn('⚠️ Pagefind搜索失败，显示无结果:', pagefindError);
				}
				// Pagefind失败时，显示空结果
				searchResults = [];
			}
		} else {
			// 开发环境和生产环境降级：使用搜索API
			try {
				// 使用混合模式搜索API（支持Strapi和本地内容）
				const apiUrl = `/api/search/?q=${encodeURIComponent(normalizedKeyword)}&limit=20`;
				console.log('🔍 发送搜索请求:', apiUrl);

				const response = await fetch(apiUrl);
				console.log('📡 搜索API响应状态:', response.status);

				if (response.ok) {
					const data = await response.json();
					console.log('📊 搜索API响应数据:', data);

					if (data.success && data.data) {
						console.log('✅ API返回成功，数据条数:', data.data.length);
						console.log('📊 搜索数据来源:', data.source || 'unknown');
						// 转换API响应格式为搜索组件期望的格式
						searchResults = data.data.map(post => ({
							url: post.url,
							meta: {
								title: post.title, // 已经包含高亮的标题
							},
							excerpt: post.excerpt, // 已经包含高亮的摘要
						}));
						console.log('🔄 转换后的搜索结果:', searchResults);
					} else {
						console.error('❌ 搜索API返回错误:', data.error || '未知错误');
						console.log('📋 完整响应数据:', data);
						searchResults = [];
					}
				} else {
					console.error('❌ 搜索API请求失败:', response.status, response.statusText);
					const errorText = await response.text();
					console.error('❌ 错误详情:', errorText);
					searchResults = [];
				}
			} catch (apiError) {
				console.error('搜索API错误:', apiError);
				// 如果API也失败，使用假数据作为最后的降级
				searchResults = fakeResult.map(item => ({
					...item,
					excerpt: item.excerpt.replace(/搜索关键词|search keywords|关键词|more button|更多按钮|expand\/collapse/g,
						(match) => `<mark>${match}</mark>`)
				}));
			}
		}



		result = searchResults;
		// 不重置显示状态，保持用户的展开选择
		// showAllResults = false; // 移除这行，避免展开后立即收起
		// 面板已经在debouncedSearch中显示了，这里不需要再次设置

		// 调试信息
		if (import.meta.env.DEV) {
			console.log('搜索关键词:', normalizedKeyword);
			console.log('搜索结果:', result.length, '个结果');
			console.log('是否显示More按钮:', result.length > maxDisplayResults);
			console.log('当前搜索状态 - keyword:', keyword);
			console.log('面板可见性:', panelVisible, 'result.length > 0:', result.length > 0);
			if (result.length > 0) {
				console.log('第一个结果:', result[0]);
			}
		}
	} catch (error) {
		console.error("Search error:", error);
		result = [];
		// 错误时不重置展开状态，保持用户体验
		// showAllResults = false; // 移除这行
		// 错误时不隐藏面板，保持用户体验
	} finally {
		isSearching = false;
	}
};

onMount(() => {
	const initializeSearch = () => {
		initialized = true;
		pagefindLoaded =
			typeof window !== "undefined" &&
			!!window.pagefind &&
			typeof window.pagefind.search === "function";
		console.log("Pagefind status on init:", pagefindLoaded);
		if (keyword) search(keyword);
	};

	// 监听重新初始化事件
	const handleReinit = () => {
		console.log('🔄 收到搜索组件重新初始化事件');
		initialized = false;
		// 重置所有状态
		result = [];
		showAllResults = false;
		lastSearchKeyword = '';
		panelVisible = false;
		isSearching = false;
		// 重新初始化
		initializeSearch();
	};



	if (import.meta.env.DEV) {
		console.log(
			"开发环境：使用搜索API进行真实内容搜索",
		);
		initializeSearch();
	} else {
		document.addEventListener("pagefindready", () => {
			console.log("Pagefind ready event received.");
			initializeSearch();
		});
		document.addEventListener("pagefindloaderror", () => {
			console.warn(
				"Pagefind load error event received. Search functionality will be limited.",
			);
			initializeSearch(); // Initialize with pagefindLoaded as false
		});

		// Fallback in case events are not caught or pagefind is already loaded by the time this script runs
		setTimeout(() => {
			if (!initialized) {
				console.log("Fallback: Initializing search after timeout.");
				initializeSearch();
			}
		}, 2000); // Adjust timeout as needed
	}

	// 绑定重新初始化事件监听器
	const searchBar = document.getElementById('search-bar');
	const searchBarMobile = document.getElementById('search-bar-inside');

	if (searchBar) {
		searchBar.addEventListener('search-reinit', handleReinit);
	}
	if (searchBarMobile) {
		searchBarMobile.addEventListener('search-reinit', handleReinit);
	}

	// 返回清理函数
	return () => {
		if (searchBar) {
			searchBar.removeEventListener('search-reinit', handleReinit);
		}
		if (searchBarMobile) {
			searchBarMobile.removeEventListener('search-reinit', handleReinit);
		}
	};
});

// 移除响应式搜索，避免重复触发
// 现在只通过用户输入事件触发搜索
</script>

<!-- search bar for desktop view -->
<div id="search-bar" data-search-component class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg w-48 relative
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
">
    <Icon icon="material-symbols:search" class="absolute left-3 text-[1.25rem] pointer-events-none transition text-black/30 dark:text-white/30 z-10"></Icon>
    <input placeholder="{i18n(I18nKey.search)}" bind:value={keyword}
           on:input={() => debouncedSearch(keyword)}
           on:focus={() => {
               // 只有在有关键词时才搜索和显示面板
               if (keyword.trim().length >= 1) {
                   search(keyword);
                   setPanelVisibility(true);
               }
               // 如果没有关键词，不显示空面板
           }}
           on:blur={(e) => {
               // 延迟隐藏面板，给用户时间点击搜索结果
               setTimeout(() => {
                   // 检查焦点是否在搜索面板内
                   if (searchPanel && !searchPanel.contains(document.activeElement) && !keyword.trim()) {
                       setPanelVisibility(false);
                   }
               }, 150);
           }}
           on:keydown={handleKeydown}
           class="w-full h-full pl-10 pr-4 text-sm bg-transparent outline-0 rounded-lg
           text-black/90 dark:text-white/90 placeholder:text-black/40 dark:placeholder:text-white/40"
    >
</div>

<!-- toggle btn for phone/tablet view -->
<button on:click={togglePanel} aria-label="Search Panel" id="search-switch"
        class="btn-plain scale-animation lg:hidden rounded-lg w-11 h-11 active:scale-90">
    <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<!-- search panel - 美化版本 -->
<div id="search-panel"
     on:mousedown={(e) => {
         // 只对非输入框元素阻止默认行为
         if (e.target.tagName !== 'INPUT') {
             e.preventDefault();
         }
     }}
     on:click={(e) => {
         // 防止事件冒泡
         e.stopPropagation();
     }}
     class="float-panel float-panel-closed search-panel absolute md:w-[32rem]
     top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-3
     bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border border-black/10 dark:border-white/15">

    <!-- search bar inside panel for phone/tablet -->
    <div class="lg:hidden mb-3">
        <div class="relative h-11 rounded-xl bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06] dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10">
            <Icon icon="material-symbols:search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-[1.25rem] pointer-events-none text-black/30 dark:text-white/30"></Icon>
            <input
                type="text"
                placeholder="Search"
                bind:value={keyword}
                on:input={() => debouncedSearch(keyword)}
                on:keydown={handleKeydown}
                class="w-full h-full pl-10 pr-4 text-sm border-0 outline-0 rounded-xl bg-transparent text-black/90 dark:text-white/90 placeholder:text-black/40 dark:placeholder:text-white/40"
                style="background: transparent !important; color: var(--text-90) !important;"
            />
        </div>
    </div>

    <!-- search results - 美化版本 -->
    {#if isSearching}
        <div class="flex items-center justify-center py-6">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]"></div>
            <span class="ml-3 text-sm text-black/60 dark:text-white/60">正在搜索...</span>
        </div>
    {:else if keyword.trim() && keyword.trim().length < 1}
        <div class="flex flex-col items-center justify-center py-6">
            <Icon icon="material-symbols:edit" class="text-3xl text-black/30 dark:text-white/30 mb-3 mx-auto"></Icon>
            <p class="text-sm text-black/60 dark:text-white/60 mb-1 text-center">请输入搜索关键词</p>
            <p class="text-xs text-black/40 dark:text-white/40 text-center">
                当前输入: "{keyword}"
            </p>
        </div>
    {:else if result.length === 0 && keyword.trim()}
        <div class="flex flex-col items-center justify-center py-6">
            <Icon icon="material-symbols:search-off" class="text-3xl text-black/30 dark:text-white/30 mb-3 mx-auto"></Icon>
            <p class="text-sm text-black/60 dark:text-white/60 mb-1 text-center">未找到相关结果</p>
            <p class="text-xs text-black/40 dark:text-white/40 text-center">
                搜索关键词: "{keyword}"
            </p>
        </div>
    {:else}
        {#each (showAllResults ? result : result.slice(0, maxDisplayResults)) as item, index}
            <a href={item.url}
               on:click={() => {
                   console.log('点击了搜索结果:', item.meta.title);

                   // 不阻止默认行为，让Swup处理导航
                   // 立即关闭面板，不需要延迟
                   setPanelVisibility(false);
                   // 重置显示状态
                   showAllResults = false;
                   // 清空搜索关键词
                   keyword = '';
                   result = [];
               }}
               class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block
               rounded-xl px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5
               active:bg-black/10 dark:active:bg-white/10
               cursor-pointer">
                <div class="transition text-black/90 dark:text-white/90 inline-flex items-center font-medium text-sm group-hover:text-[var(--primary)]">
                    <Icon icon="material-symbols:article-outline" class="text-xs mr-2 opacity-60"></Icon>
                    <span>{@html item.meta.title}</span>
                    <Icon icon="fa6-solid:chevron-right" class="transition text-xs translate-x-1 ml-auto opacity-60 group-hover:opacity-100 group-hover:text-[var(--primary)]"></Icon>
                </div>
                <div class="transition text-xs text-black/60 dark:text-white/60 mt-1 leading-relaxed line-clamp-2">
                    {@html item.excerpt}
                </div>
            </a>
        {/each}

        <!-- More/Less 按钮 - 匹配风格样式 -->
        {#if result.length > maxDisplayResults}
            <div class="pt-2 mt-2 space-y-2">
                {#if !showAllResults}
                    <!-- 展开按钮 -->
                    <button
                        on:click={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            showAllResults = true;
                            // 确保面板保持显示
                            setPanelVisibility(true);
                        }}
                        class="w-full group flex items-center justify-center px-4 py-2
                               rounded-lg text-xs font-medium transition-all
                               bg-black/3 hover:bg-black/5 dark:bg-white/5 dark:hover:bg-white/8
                               text-black/70 dark:text-white/70 hover:text-[var(--primary)]
                               border border-black/5 dark:border-white/10
                               hover:border-[var(--primary)]/20 hover:shadow-sm">
                        <Icon icon="material-symbols:expand-more" class="text-sm mr-1 transition-transform group-hover:scale-110"></Icon>
                        展开更多
                        <span class="ml-1 text-[var(--primary)] opacity-60">(+{result.length - maxDisplayResults})</span>
                    </button>

                    <!-- 查看全部按钮 -->
                    <a
                        href={`/search/?q=${encodeURIComponent(keyword)}`}
                        on:click={() => {
                            // 关闭搜索面板
                            setPanelVisibility(false);
                            // 清空搜索关键词
                            keyword = '';
                            result = [];
                        }}
                        class="w-full group flex items-center justify-center px-4 py-2
                               rounded-lg text-xs font-medium transition-all
                               bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20
                               text-[var(--primary)] hover:text-[var(--primary)]
                               border border-[var(--primary)]/20 hover:border-[var(--primary)]/40
                               hover:shadow-sm">
                        <Icon icon="material-symbols:open-in-new" class="text-sm mr-1 transition-transform group-hover:scale-110"></Icon>
                        查看全部结果
                        <span class="ml-1 opacity-60">({result.length})</span>
                    </a>
                {:else}
                    <!-- 收起按钮 -->
                    <button
                        on:click={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            showAllResults = false;
                            // 确保面板保持显示
                            setPanelVisibility(true);
                        }}
                        class="w-full group flex items-center justify-center px-4 py-2
                               rounded-lg text-xs font-medium transition-all
                               bg-black/3 hover:bg-black/5 dark:bg-white/5 dark:hover:bg-white/8
                               text-black/70 dark:text-white/70 hover:text-[var(--primary)]
                               border border-black/5 dark:border-white/10
                               hover:border-[var(--primary)]/20 hover:shadow-sm">
                        <Icon icon="material-symbols:expand-less" class="text-sm mr-1 transition-transform group-hover:scale-110"></Icon>
                        收起结果
                        <span class="ml-1 text-[var(--primary)] opacity-60">({result.length})</span>
                    </button>

                    <!-- 查看全部按钮 -->
                    <a
                        href={`/search/?q=${encodeURIComponent(keyword)}`}
                        on:click={() => {
                            // 关闭搜索面板
                            setPanelVisibility(false);
                            // 清空搜索关键词
                            keyword = '';
                            result = [];
                        }}
                        class="w-full group flex items-center justify-center px-4 py-2
                               rounded-lg text-xs font-medium transition-all
                               bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20
                               text-[var(--primary)] hover:text-[var(--primary)]
                               border border-[var(--primary)]/20 hover:border-[var(--primary)]/40
                               hover:shadow-sm">
                        <Icon icon="material-symbols:open-in-new" class="text-sm mr-1 transition-transform group-hover:scale-110"></Icon>
                        查看全部结果
                        <span class="ml-1 opacity-60">({result.length})</span>
                    </a>
                {/if}
            </div>
        {/if}
    {/if}
</div>

<style>
  input:focus {
    outline: 0;
  }

  .search-panel {
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    /* 自定义滚动条 */
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  }

  .search-panel::-webkit-scrollbar {
    width: 6px;
  }

  .search-panel::-webkit-scrollbar-track {
    background: transparent;
  }

  .search-panel::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  .dark .search-panel::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
  }

  /* 限制摘要显示行数 */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* 搜索高亮样式优化 */
  :global(.search-panel mark) {
    background-color: rgba(var(--primary-rgb), 0.2);
    color: var(--primary);
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: 500;
  }

  /* 面板动画优化 */
  .search-panel {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: top;
  }

  .float-panel-closed {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
    pointer-events: none;
  }
</style>
