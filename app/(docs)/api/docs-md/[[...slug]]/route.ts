import { notFound } from "next/navigation";
import { source } from "@/lib/docs-source";

/**
 * Raw-Markdown companion route for docs pages. proxy.ts rewrites
 * `/docs/<page>.md` to `/api/docs-md/<page>`, so every published page has a
 * matching `.md` URL that serves its processed Markdown body.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const body = await page.data.getText("processed");
  return new Response(`# ${page.data.title}\n\n${body}`, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({ slug: page.slugs }));
}

export const dynamic = "force-static";
