import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const sitemaps = [
    `${site}sitemap-0.xml`, // 主要页面
    `${site}sitemap-posts.xml`, // 文章页面
    `${site}sitemap-categories.xml`, // 分类页面
  ];

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${sitemap}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
