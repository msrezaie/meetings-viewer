import type { MetadataRoute } from "next";
import { source } from "@/lib/docs-source";
import { siteConfig } from "@/lib/site-config";

/**
 * sitemap.xml - every crawlable surface: the landing page, the viewer, and
 * every docs page. Keystatic (/keystatic) is intentionally excluded - it is
 * an editing surface, not content, and robots.ts disallows it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const docs = source.getPages().map((page) => ({
    url: `${siteConfig.url}${page.url}`,
    lastModified: page.data.lastModified,
  }));

  return [
    { url: siteConfig.url },
    { url: `${siteConfig.url}/scrapers` },
    ...docs,
  ];
}
