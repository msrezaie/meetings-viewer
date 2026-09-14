import { defineDocs, defineConfig } from "fumadocs-mdx/config";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    // Expose each page's processed Markdown via page.data.getText("processed")
    // so llms-full.txt, the per-page .md routes, and agents can all read the
    // same text a visitor sees.
    postprocess: { includeProcessedMarkdown: true },
    lastModified: true,
  },
});

export default defineConfig();
