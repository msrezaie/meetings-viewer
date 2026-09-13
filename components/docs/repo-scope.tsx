/**
 * Stamps a docs page with the codebase it describes. The docs cover two
 * different repo families - this repo (Meetings Viewer) and the scraper repos
 * (city-scrapers-core plus per-city consumers) - and mixing them up is the
 * confusion this platform exists to prevent. Place one above the fold on any
 * page whose commands or file paths run against the scraper repos.
 */
const REPOS = {
  "meetings-viewer": {
    name: "city-scrapers-meetings-viewer",
    hint: "the Next.js app and docs you are reading",
  },
  scrapers: {
    name: "city-scrapers (core + consumer repos)",
    hint: "city-scrapers-core and the per-city repos like city-scrapers-fortx",
  },
} as const;

export function RepoScope({ repo }: { repo: keyof typeof REPOS }) {
  const target = REPOS[repo];
  return (
    <div className="not-prose border-fd-border bg-fd-card mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
      <span className="text-fd-muted-foreground mt-0.5 font-mono text-[0.7rem] font-semibold tracking-wider uppercase">
        Repo
      </span>
      <div className="min-w-0">
        <code className="text-fd-foreground font-mono text-[0.85em]">
          {target.name}
        </code>
        <span className="text-fd-muted-foreground block">{target.hint}</span>
      </div>
    </div>
  );
}
