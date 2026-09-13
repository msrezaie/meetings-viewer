import { source } from "@/lib/docs-source";
import { llms } from "fumadocs-core/source";

const llmsConfig = llms(source);

export async function GET() {
  return new Response(await llmsConfig.index(), {
    headers: { "content-type": "text/plain" },
  });
}

export const dynamic = "force-static";
