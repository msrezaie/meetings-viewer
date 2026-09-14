# Meetings Viewer

A web interface for inspecting the output of city-meeting scrapers. Each
scraper lives in its own repository and emits a list of meeting records;
this app turns that JSON into a browsable, filterable table.

Three surfaces:

- `/` - landing page
- `/docs` - documentation platform (Fumadocs + MDX)
- `/scrapers` - the meetings table

Built with Next.js (App Router), MUI, Fumadocs, and Keystatic. Two modes
share one UI: local mode reads scraper output from disk; production mode
(planned) fetches it from GitHub. No database either way.

## Requirements

- Node.js >=20.11.0 (`.nvmrc` pins 24)
- npm

## Setup

```sh
git clone <repo-url> meetings-viewer
cd meetings-viewer
npm install
npm run dev
```

The dev server runs at http://localhost:3000 - `/` is the landing page,
`/scrapers` is the viewer, `/docs` the documentation, `/keystatic` the
docs editor.

## Loading data

Run a spider from a city-scrapers repo and write its output into this
repo's data directory:

```sh
scrapy crawl <spider_name> -O <path-to-meetings-viewer>/data/scrapers/<spider_name>.json
```

- Use uppercase `-O`, which overwrites the file on each run. Lowercase
  `-o` appends and produces duplicate records on subsequent runs.
- The filename without `.json` must match the spider's `name` attribute -
  it becomes the URL slug: `fortx_council.json` is served at
  `/scrapers/fortx_council`.

## Documentation

The docs platform covers everything in depth; these links resolve on
GitHub:

- [Docs home](content/docs/index.mdx) - building a scraper vs. reviewing one
- [Quick start](content/docs/viewer/quick-start.mdx) - load output and inspect it
- [Architecture](content/docs/viewer/architecture.mdx) - the two modes, data layer, invariants
- [Schema reference](content/docs/qa/schema.mdx) - the twelve meeting-record fields
- [Contributing](content/docs/contributing/index.mdx) - editing docs and code, project structure, docs commands
- [Conflict report](content/docs/conflicts.mdx) - where docs and sources disagree

Production mode is planned, not built - the design and its open questions
live in the [architecture doc](content/docs/viewer/architecture.mdx).
