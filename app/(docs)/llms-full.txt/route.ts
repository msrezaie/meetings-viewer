import { source } from "@/lib/docs-source";

/**
 * llms-full.txt: every docs page's full processed Markdown, concatenated.
 * getText("processed") reads the Markdown emitted by the postprocess option
 * in source.config.ts - this is the body text agents should consume, not a
 * list of titles.
 */
export async function GET() {
  const parts = await Promise.all(
    source.getPages().map(async (page) => {
      const body = await page.data.getText("processed");
      return `# ${page.data.title}\n\nURL: ${page.url}\n\n${body}`;
    })
  );
  return new Response(parts.join("\n\n---\n\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export const dynamic = "force-static";
