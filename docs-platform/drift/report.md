# Docs drift report

5 finding(s) across 9 claims.

Standing view: [/docs/conflicts](/docs/conflicts). Machine-readable: [docs-platform/drift/findings.json](findings.json).

## @msrezaie

- **meeting.status vocabulary** (certain, blocking) `[f820fd38c779b57a]`
  - master: `docs-platform/sources/city-scrapers-core/constants.py` = ["cancelled","tentative","confirmed","passed"]
  - source: `docs-platform/sources/city-scraper-project-tech-guide.md` = ["TENTATIVE","PASSED","CANCELED"]
    - extra: CANCELED
  - action: Do not edit the mirror. Check whether upstream docs-platform/sources/city-scrapers-core/constants.py changed; if the mirror is stale, re-sync it and update sources.json.
- **meeting.status vocabulary** (certain, blocking) `[830d425dea6f0715]`
  - master: `docs-platform/sources/city-scrapers-core/constants.py` = ["cancelled","tentative","confirmed","passed"]
  - source: `docs-platform/sources/city-scrapers-development-guide.md` = ["passed","tentative","cancelled"]
    - missing: confirmed
  - action: Do not edit the mirror. Check whether upstream docs-platform/sources/city-scrapers-core/constants.py changed; if the mirror is stale, re-sync it and update sources.json.
- **meeting.status vocabulary** (certain, blocking) `[e2c9f2505e27c7e0]`
  - master: `docs-platform/sources/city-scrapers-core/constants.py` = ["cancelled","tentative","confirmed","passed"]
  - source: `docs-platform/sources/skills/spider-review/SKILL.md` = ["tentative","passed","cancelled"]
    - missing: confirmed
  - action: Do not edit the mirror. Check whether upstream docs-platform/sources/city-scrapers-core/constants.py changed; if the mirror is stale, re-sync it and update sources.json.
- **meeting.classification vocabulary** (certain, blocking) `[dcc71a2b070b5c50]`
  - master: `docs-platform/sources/city-scrapers-core/constants.py` = ["Advisory Committee","Board","City Council","Commission","Committee","Forum","Police Beat","Not classified"]
  - source: `docs-platform/sources/city-scraper-project-tech-guide.md` = ["COUNCIL","UNCLASSIFIED"]
    - extra: COUNCIL, UNCLASSIFIED
  - action: Do not edit the mirror. Check whether upstream docs-platform/sources/city-scrapers-core/constants.py changed; if the mirror is stale, re-sync it and update sources.json.
- **meeting.classification vocabulary** (certain, blocking) `[a70d62cb8c74d6c7]`
  - master: `docs-platform/sources/city-scrapers-core/constants.py` = ["Advisory Committee","Board","City Council","Commission","Committee","Forum","Police Beat","Not classified"]
  - source: `data/scrapers/test_spider2.json` = ["Co","Board"]
    - extra: co
  - action: Review data/scrapers/test_spider2.json against docs-platform/sources/city-scrapers-core/constants.py.

---
To accept a finding as known-correct, add its fingerprint to `docs-platform/drift/mutes.json` with a reason. Mutes expire automatically when the disagreeing values change.
