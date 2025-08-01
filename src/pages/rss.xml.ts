import rss from "@astrojs/rss";
import { getSortedPosts } from "@utils/hybrid-content-utils";
import type { APIContext } from "astro";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { siteConfig } from "@/config";
import { getIndexSettings } from "@/lib/strapi";

const parser = new MarkdownIt();

function stripInvalidXmlChars(str: string): string {
	return str.replace(
		// biome-ignore lint/suspicious/noControlCharactersInRegex: https://www.w3.org/TR/xml/#charsets
		/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
		"",
	);
}

export async function GET(context: APIContext) {
	const blog = await getSortedPosts();

	// 获取 Strapi 中的站点设置
	let rssTitle = siteConfig.title;
	let rssDescription = siteConfig.subtitle || "No description";

	try {
		const indexSettings = await getIndexSettings();
		if (indexSettings.data) {
			if (indexSettings.data.site_title) {
				rssTitle = indexSettings.data.site_title;
			}
			if (indexSettings.data.site_description) {
				rssDescription = indexSettings.data.site_description;
			} else if (indexSettings.data.site_subtitle) {
				rssDescription = indexSettings.data.site_subtitle;
			}
		}
	} catch (error) {
		console.error('获取RSS设置失败，使用默认配置:', error);
	}

	return rss({
		title: rssTitle,
		description: rssDescription,
		site: context.site ?? "https://sparkdone.com",
		items: blog.map((post) => {
			const content =
				typeof post.body === "string" ? post.body : String(post.body || "");
			const cleanedContent = stripInvalidXmlChars(content);

			// 获取作者信息
			const getAuthorName = (author: any) => {
				if (typeof author === 'string') {
					return author;
				} else if (author && typeof author === 'object' && author.name) {
					return author.name;
				}
				return 'SparkDone';
			};

			return {
				title: post.data.title,
				pubDate: post.data.published,
				description: post.data.description || post.data.title,
				link: `/posts/${post.slug}/`,
				content: sanitizeHtml(parser.render(cleanedContent), {
					allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
				}),
				author: getAuthorName(post.data.author),
				categories: post.data.tags || [],
				customData: [
					post.data.category && `<category>${post.data.category}</category>`,
					post.data.updated && `<updated>${post.data.updated.toISOString()}</updated>`,
				].filter(Boolean).join(''),
			};
		}),
		customData: `
			<language>${siteConfig.lang}</language>
			<managingEditor>admin@sparkdone.com (SparkDone)</managingEditor>
			<webMaster>admin@sparkdone.com (SparkDone)</webMaster>
			<generator>Astro v${process.env.npm_package_version || '4.0.0'}</generator>
			<docs>https://www.rssboard.org/rss-specification</docs>
			<ttl>60</ttl>
		`,
	});
}
