import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { source } from "@/lib/docs-source";
import {
  DocsPage,
  DocsBody,
  DocsTitle,
  DocsDescription,
} from "fumadocs-ui/page";
import { ViewOptionsPopover } from "fumadocs-ui/layouts/docs/page";
import { getMDXComponents } from "@/components/docs/mdx";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) return {};
  return {
    title: page.data.title,
    description: page.data.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MdxContent = page.data.body;
  const markdownUrl = `${page.url}.md`;
  const githubUrl = `${siteConfig.repoUrl}/blob/main/content/docs/${page.path}`;

  return (
    <DocsPage
      toc={page.data.toc}
      lastUpdate={page.data.lastModified}
      tableOfContent={{
        footer: (
          <ViewOptionsPopover markdownUrl={markdownUrl} githubUrl={githubUrl} />
        ),
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MdxContent components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: page.slugs,
  }));
}
