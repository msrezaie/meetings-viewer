/**
 * The one registry for outbound links referenced by the docs. The
 * /docs/reference/links page renders straight from this list, so a URL that
 * needs updating is edited exactly once. Keep entries factual - a URL plus
 * one line on what it is.
 */

export interface DocLink {
  label: string;
  url: string;
  note?: string;
}

export interface DocLinkGroup {
  category: string;
  items: DocLink[];
}

export const DOC_LINKS: DocLinkGroup[] = [
  {
    category: "Project",
    items: [
      {
        label: "cityscrapers.org",
        url: "https://cityscrapers.org/",
        note: "The project home and legacy development guide",
      },
      {
        label: "cityscrapers.org development docs",
        url: "https://cityscrapers.org/docs/development/",
        note: "Event schema, Legistar notes, how to create a spider",
      },
      {
        label: "Documenters.org",
        url: "https://www.documenters.org/",
        note: "The platform scraper output ultimately powers",
      },
    ],
  },
  {
    category: "Repositories",
    items: [
      {
        label: "city-scrapers-core",
        url: "https://github.com/City-Bureau/city-scrapers-core",
        note: "Shared framework: CityScrapersSpider, LegistarSpider, schema validation",
      },
      {
        label: "city-scrapers template",
        url: "https://github.com/City-Bureau/city-scrapers-template",
        note: "Starter template every consumer repo is generated from",
      },
      {
        label: "scrapy-sentry-errors",
        url: "https://github.com/City-Bureau/scrapy-sentry-errors",
        note: "Reports spider-level errors to Sentry",
      },
      {
        label: "city-scrapers-fortx",
        url: "https://github.com/City-Bureau/city-scrapers-fortx/",
        note: "Consumer repo used for most CTD development",
      },
    ],
  },
  {
    category: "Spider examples",
    items: [
      {
        label: "GET + CSS selectors",
        url: "https://github.com/City-Bureau/city-scrapers-atconj/blob/main/city_scrapers/spiders/atconj_County_Commission.py",
      },
      {
        label: "GET + POST requests",
        url: "https://github.com/City-Bureau/city-scrapers-fortx/blob/main/city_scrapers/spiders/fortx_Fort_Worth_City_Council.py",
      },
      {
        label: "CSS selectors only",
        url: "https://github.com/msrezaie/city-scrapers-wichita/blob/main/city_scrapers/spiders/wicks_sedgwick_jcab.py",
      },
      {
        label: "GET with authentication",
        url: "https://github.com/City-Bureau/city-scrapers-losca/blob/main/city_scrapers/spiders/losca_Public_Works.py",
      },
      {
        label: "Legistar (ASP.NET platforms)",
        url: "https://github.com/City-Bureau/city-scrapers-losca/blob/main/city_scrapers/spiders/losca_Metro_Transit.py",
      },
      {
        label: "Spider factory: city-scrapers-tulsa PR #6",
        url: "https://github.com/City-Bureau/city-scrapers-tulsa/pull/6",
      },
      {
        label: "Spider factory: city-scrapers-colgo PR #6",
        url: "https://github.com/City-Bureau/city-scrapers-colgo/pull/6",
      },
    ],
  },
  {
    category: "Tooling",
    items: [
      {
        label: "Scrapy docs",
        url: "https://docs.scrapy.org/en/latest/topics/commands.html",
      },
      {
        label: "Postman",
        url: "https://www.postman.com/",
        note: "Probe agency endpoints before writing parsing code",
      },
      {
        label: "pipenv",
        url: "https://pipenv.pypa.io/en/latest/",
        note: "Dependency management used by every consumer repo",
      },
      {
        label: "RFC 5545 (iCalendar)",
        url: "https://www.ietf.org/rfc/rfc5545.txt",
        note: "The spec iCalendar-type scrapers parse",
      },
      {
        label: "Internet Archive Wayback Machine",
        url: "https://web.archive.org/",
        note: "archive.yml submits scraped URLs here daily",
      },
    ],
  },
  {
    category: "Learning",
    items: [
      {
        label: "Scrapy tutorial (video)",
        url: "https://www.youtube.com/watch?v=mBoX_JCKZTE",
      },
      {
        label: "Scrapy playlist",
        url: "https://www.youtube.com/playlist?list=PLRzwgpycm-Fjvdf7RpmxnPMyJ80RecJjv",
      },
      {
        label: "Python for beginners",
        url: "https://www.youtube.com/watch?v=6i3e-j3wSf0&list=PL0Zuz27SZ-6MQri81d012LwP5jvFZ_scc",
      },
      {
        label: "Python OOP primer",
        url: "https://www.youtube.com/watch?v=K5KVEU3aaeQ",
      },
    ],
  },
];
