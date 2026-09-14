import type { Metadata } from "next";
import PageHeader from "@/components/scrapers/PageHeader";
import ScrapersTable from "@/components/scrapers/ScrapersTable";
import { listScrapers } from "@/lib/scraper-data";
import { pageTitle, siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: pageTitle(siteConfig.pages.scrapers.title),
  description: siteConfig.pages.scrapers.description,
};

export default async function ScrapersPage() {
  const { spiders } = await listScrapers();

  return (
    <>
      <PageHeader title="Scrapers" backHref="/" backLabel="Back to Home" />
      <ScrapersTable spiders={spiders} />
    </>
  );
}
