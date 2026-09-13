# Meetings Viewer

A web interface for inspecting the output of city-meeting scrapers. Each
scraper lives in its own repository and emits a list of meeting records;
this app turns that JSON into a browsable, filterable table.

The repo hosts three surfaces:

- **Landing** - `/`, the public-facing overview.
- **Docs** - `/docs`, the documentation platform (Fumadocs + MDX), including
  the drift reporter, generated schema reference, and QA tooling.
- **Viewer** - `/scrapers`, the meetings table.

There are two intended modes (not yet fully planned):

- **Local** — used while developing a scraper. The scraper writes its
  output to a designated directory on disk and the viewer renders it,
  refreshing automatically on each run.
- **Production** — used to review a scraper's output during PR review,
  before the scraper is merged. The viewer pulls JSON from a GitHub
  Actions workflow attached to the open PR. No database.

Both modes share the same UI; only the data source differs.

## Pages

- **`/`** — landing page.
- **`/docs`** — documentation platform; see `content/docs/` for content and
  `docs-platform/` for the engine, mirrored sources, and generated artifacts.
- **`/docs/conflicts`** — standing view of drift findings.
- **`/docs/analytics`** — fleet health and docs performance.
- **`/keystatic`** — visual editor for docs content (local storage).
- **`/scrapers`** — table listing every scraper currently available.
- **`/scrapers/:name`** — table of meeting records for one scraper, with
  search, sort by start time, and status filtering. A stats panel above
  the table shows the total record count plus a count for each status
  (Passed, Cancelled, Tentative, Confirmed), always rendered even when zero.

## Tech stack

- Next.js (App Router)
- MUI for component primitives (Container, Button, Typography, etc.)
- Fumadocs for the documentation platform
- Keystatic for the docs editor at `/keystatic`
- No database. Local mode reads scraper output from disk via a Next API
  route; production mode fetches from GitHub.

## Local Mode

### Requirements

- Node.js 20.9+
- npm

### Setup

```sh
git clone <repo-url> meetings-viewer
cd meetings-viewer
npm install
npm run dev
```

The dev server runs at http://localhost:3000. `/` serves the landing page;
the viewer lives at `/scrapers` and the docs at `/docs`.

### Loading data

The viewer reads scraper output from `data/scrapers/*.json` relative to the
meetings-viewer repo root. To populate it, run a scrapy spider from inside the
city-scrapers repo and direct output to that path using scrapy's `-O` flag:

```sh
cd <path-to-city-scrapers-repo>
scrapy crawl <spider_name> -O <path-to-meetings-viewer>/data/scrapers/<spider_name>.json
```

For example, if both repos are siblings under `~/code/`:

```sh
cd ~/code/city-scrapers-fortx
scrapy crawl fortx_council -O ~/code/meetings-viewer/data/scrapers/fortx_council.json
```

Notes:

- Use the capital `-O` flag, which overwrites the file on each run. The
  lowercase `-o` flag appends and will produce duplicate records on
  subsequent runs.
- The output filename without `.json` must match the spider's `name`
  attribute. It becomes the slug in the viewer's URL: `fortx_council.json`
  becomes `/scrapers/fortx_council`.

### Project structure

```
meetings-viewer/
├── app/
│   ├── (landing)/               # landing page
│   ├── (docs)/                  # /docs routes (Fumadocs), llms routes, docs-md API
│   ├── (viewer)/                # /scrapers routes
│   │   └── scrapers/
│   │       ├── page.tsx         # /scrapers
│   │       └── [spider]/        # /scrapers/:spider
│   ├── (keystatic)/             # /keystatic editor mount
│   ├── layout.tsx               # root layout: MUI theme + site chrome
│   ├── theme.ts                 # MUI theme
│   └── globals.css              # CSS layers + Fumadocs theme mapping
├── components/
│   ├── landing/                 # landing-page sections
│   ├── layout/                  # site header, footer, chrome, docs search
│   ├── scrapers/                # viewer components (tables, filters, panels)
│   ├── ui/                      # shared presentational components
│   │                            # (StatusChip, LocationDisplay, Linkify, ...)
│   └── docs/                    # MDX components (RepoScope, SchemaTable, ...)
├── content/docs/                # MDX documentation content
├── docs-platform/               # docs-only internals
│   ├── engine/                  # drift checker, link checker, schema generator
│   ├── drift/                   # claim registry, findings, report, mutes
│   ├── generated/               # meeting-schema.json (npm run docs:schema)
│   ├── lighthouse/              # Lighthouse CI history (one point per build)
│   ├── sources/                 # byte-faithful mirrors of upstream docs
│   ├── fixtures/                # drift test corpus
│   ├── vale/                    # prose-gate vocabulary
│   ├── links.ts                 # outbound-link registry for /docs/reference/links
│   └── playbooks/               # this platform's design documents
├── data/scrapers/               # scrapy output (gitignored except fixtures)
├── hooks/                       # reusable stateful logic
├── contexts/                    # React context providers
└── lib/                         # pure logic: no JSX, no React imports
    ├── docs-source.ts           # Fumadocs content source
    ├── scraper-data.ts          # MeetingRecord type + data-source module
    ├── meeting-columns.ts       # table column definitions
    ├── meeting-utils.ts         # meeting helpers (status, location text)
    ├── duplicate-detection.ts   # duplicate-detection logic
    ├── site-config.ts           # site name/description
    └── ui-constants.ts          # shared UI constants
```

Code is organized by what kind of thing it is (pure logic vs. UI vs. constant)
and how far it reaches (used in one place vs. shared), with the three
surfaces kept separate: landing under `components/landing/`, docs under
`components/docs/` + `content/docs/` + `docs-platform/`, viewer under
`components/scrapers/` + `app/(viewer)/`.

- Pure logic with no JSX that operates on data belongs in `lib/` — meeting-specific
  helpers in `lib/meeting-utils.ts`, otherwise the relevant `lib/` module. A hook or
  component needing this logic imports it from `lib/`, never from another component.
- A presentational component used by two or more parents belongs in `components/ui/`.
- A feature or page component belongs in its surface's folder
  (`components/landing/`, `components/scrapers/`, `components/docs/`).
- A sub-component used by exactly one parent stays un-exported in that parent's file.
- Constants live at the smallest scope that needs them: local to a file, bound to
  the component that owns them, or in the shared `lib/`/`components/ui/` module
  they belong to if genuinely shared across files.
- Docs-platform internals (drift engine, mirrored sources, generated
  artifacts, prose/vocab config) live under `docs-platform/` — not the repo
  root — unless the framework requires it (e.g. `keystatic.config.ts`,
  `.vale.ini`).

## Docs platform commands

```sh
npm run docs:drift        # drift check: rewrite findings.json + report.md
npm run docs:drift:check  # same, exit 1 on blocking findings
npm run docs:drift:test   # fixture-corpus recall/precision test
npm run docs:schema       # regenerate docs-platform/generated/meeting-schema.json
npm run docs:links        # internal link + anchor check over content/docs
```

## Data shapes

### Meeting record

Each scraper's output JSON is an array of meeting records:

| Field            | Type    | Notes                                                      |
| ---------------- | ------- | ---------------------------------------------------------- |
| `id`             | string  | Format: `{spider}/{timestamp}/{...}`                       |
| `title`          | string  |                                                            |
| `description`    | string  |                                                            |
| `classification` | string  | e.g. `"Board"`, `"Committee"`                              |
| `start`          | string  | `"YYYY-MM-DD HH:mm:ss"`, no timezone                       |
| `end`            | string  | `"YYYY-MM-DD HH:mm:ss"`, no timezone                       |
| `all_day`        | boolean |                                                            |
| `time_notes`     | string  |                                                            |
| `location`       | object  | `{ name: string, address: string }`                        |
| `links`          | array   | `[{ href: string, title: string }, ...]`                   |
| `source`         | string  | URL of the page the meeting was scraped from               |
| `status`         | string  | `"passed"`, `"cancelled"`, `"tentative"`, or `"confirmed"` |

### Index response

The `/scrapers` page is populated by the data-source module's
`listScrapers()` function, which returns:

```json
{
  "spiders": [{ "slug": "atl_council" }, { "slug": "charnc_meck_schools" }]
}
```

In local mode this shape is constructed at request time by listing
`data/scrapers/*.json`. There is no manifest file on disk; the directory
listing is the source of truth.

## Production Mode (planned)

When production is built, the viewer will fetch scraper output from a
dedicated public GitHub repository (`meetings-viewer-data`) populated by
GitHub Actions workflows attached to each city-scrapers repo. PR-scoped data
is created when a PR is opened and removed when the PR closes. Implementation
details are tracked in the technical specification and are not part of the
current build.

The production version reuses every component and route from the local
version. Only `lib/scraper-data.ts` changes between modes.
