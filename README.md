# Pride Map

An interactive map of Pride parades across Europe. Each Pride is a coloured dot whose hue says how soon its next date is and whose size says how many people line the streets; an unfilled ring means the date for the coming season has not been announced yet. The intent is simple: make it easy to see, at a glance, which Prides are coming up near you and how the calendar fills out across the continent over the year.

A Pride is a recurring event, not a date. It keeps one record, one id and one page across the years, with a list of editions under it. That is what lets the map stay useful in February, when most of the season has no dates yet, and it is what the work plan in [PLAN-2027.md](PLAN-2027.md) is built around.

Live site: https://pridemap.net/ — with a GitHub Pages mirror at https://bagruber.github.io/pridemap/ (SPA only; it canonicalises to the main domain).

## Purpose

Pride parades happen across hundreds of European cities every year, but information about them is scattered across local sites, social media, and word of mouth. This project pulls that information into one place and lets you browse it spatially or as a list. It is not affiliated with any organising body; it is a hobby project built to help people find events.

## Functionality

- Map view with all events plotted on a dark CartoDB Dark Matter basemap, rendered through MapLibre GL.
- List view with search across city, region and event name, sortable by date or alphabetically.
- Filters for country, event size and timeframe (upcoming, past, all, this weekend, next weekend).
- Regional presets for Europe and DACH (Germany, Austria, Switzerland).
- Travel time isochrones (driving and cycling) from any clicked point, powered by HERE.
- A detail view with the date, a countdown, a route link, an "Add to Calendar" .ics download, attendance figures where available, the ILGA Rainbow Index score for the country, where the date came from, and links to the official site and Instagram.
- On phones the whole interface is one bottom sheet with three stops: results grouped by date, the filters as a row of chips, and the colour scale as a legend. The detail is a second sheet, and the back button closes it.
- Geolocation button to fly the map to your current position.
- German and English translations.
- Shareable URLs: the active view, filters and selected event are encoded in the URL hash so a link reproduces exactly what you see.
- A crawlable static page per event in both languages (`/de/<slug>/`, `/en/<slug>/`), plus country and month hub pages — generated at build time so search engines and link previews see real content, not an empty SPA shell.
- A share image per event (map background with the event card), used as the OG/preview image and as the hero on its page. A 1080×1920 story version can be rendered on demand.

## Tech stack

- React 19 with Vite 8 as the build tool, pnpm as the package manager. Versions follow the shared baseline in `../hausbasis/baseline.json`; check with `node ../hausbasis/check.mjs --kurz` before bumping anything.
- MapLibre GL JS v5 for map rendering, with CartoDB Dark Matter as the tile source.
- HERE Routing API for isochrone polygons (optional, requires an API key).
- Plain CSS, no framework, no preprocessor.
- Vitest for the tests around filtering, search, seasons and editions: `pnpm test`.
- Static deployment to GitHub Pages via `gh-pages`, and to Hostinger for the canonical site.

## Data pipeline

The source of truth is one JSON file per country under `data/prides/`, each an array of Prides sorted by id. One file per country because research happens country by country: small diffs, small files, no conflicts between parallel sessions. The schema is in [PLAN-2027.md](PLAN-2027.md), Appendix A.

`pnpm run data` reads those files, validates them (Appendix B), attaches each country's ILGA Rainbow Index from `data/rainbow-map-2026.csv`, and writes the slim runtime copy to `src/data/prides.json` - generated, gitignored, and rebuilt before every `dev` and every build. It also rewrites `public/llms.txt` from the live counts. Known gaps are reported as warnings and counted by kind; `pnpm run data --warnings` lists them.

## Research

Finding and confirming dates is the ongoing work, and it runs on its own loop. `data/sources.json` holds the overview sources and the search terms per country, `data/recherche-log.md` is the append-only record of what each session covered. A session picks the country with the oldest sweep, works through its sources, writes the findings into that country's file and commits it on its own. Every date carries the URL it came from and the day it was last checked; a date that would only be a guess from last year's pattern is not entered at all. The waves and the search matrix are in [PLAN-2027.md](PLAN-2027.md), section 5.

## Caveats

Read these before relying on the data.

- **Coverage is incomplete.** The dataset is hand curated from public sources and will be missing parades, especially smaller and newer ones. If you find a gap, use the suggestion form (see below).
- **Sizes come from the numbers, where there are numbers.** Small is under 3,000, medium up to 30,000, large above, counting spectators. Where no figure is known the class is an estimate and marked as one in the data (`sizeEstimated`).
- **Attendance numbers are approximate and inconsistently counted.** Reports mix people marching with people watching, and authorities and organisers often disagree by a wide margin. Each figure records who counted and, where known, the sentence it came from.
- **Dates can shift, and many are not set yet.** Every edition carries a status: confirmed by the organisers, announced elsewhere, rescheduled, cancelled, or unverified (the 2026 data, migrated from a dataset without sources). Always check the official site before making travel plans.
- **The ILGA Rainbow Index is a country level score**, not a measure of how welcoming a specific city or event is. Local context can differ sharply from the national score.
- **Isochrones are best effort.** Travel time bands depend on routing data quality, traffic models and the HERE network for that region. Treat them as a rough guide, not a guarantee.

## Suggesting events

If a Pride is missing or a detail is wrong, the fastest way to get it fixed is the suggestion form linked in the app: https://forms.gle/oo6vk3QfANXskXku8. Pull requests against the country's file in `data/prides/` are also welcome - please include the source URL for anything you add.

## Local development

```
pnpm install
pnpm run dev
```

`dev` runs `pnpm run data` first, so `src/data/prides.json` is always in step with `data/prides/`.

For isochrones, create a `.env` with `VITE_HERE_API_KEY=<your key>`. Without it, the isochrone panel is visible but inactive.

### Static pages and share images

The canonical build (`pnpm run build:hostinger`) does three things beyond the SPA bundle:

```
pnpm run data                # validate data/prides/ -> src/data/prides.json
pnpm run og                  # one 1200x630 share image per dated edition
vite build --base=/          # the app itself
node scripts/prerender.mjs   # Pride + hub pages, redirects, sitemap, JSON-LD
```

- **Share images** are rendered by `scripts/og-images.mjs`: a card drawn over a mosaic of CARTO raster tiles, screenshotted with headless Chromium. They land in `og-cache/` (gitignored) and are copied into `dist/og/` by the prerenderer. Generation is incremental — existing files are skipped, so only new events cost time. The cache key carries the edition's date, so a Pride that moves gets a new image. Use `pnpm run og:force` to redo everything, and `node scripts/og-images.mjs --story <slug>` for a 1080×1920 story version.
- Chromium comes from the Playwright cache. If it is missing, run `npx playwright install chromium` or point `PLAYWRIGHT_CHROMIUM_PATH` at a binary.
- **Pages** are written by `scripts/prerender.mjs`: `/de/<slug>/` and `/en/<slug>/` per Pride, country and month hubs, a language index each, and a sitemap with hreflang alternates. The URLs carry no year - a Pride keeps its page across seasons, and the season appears in the title and the heading instead. `data/legacy-urls.txt` lists every URL that was live before that change; each one that no longer exists gets a forwarding page. Slugs and localized vocabulary live in `scripts/lib/pages.mjs`.

The GitHub Pages build stays SPA-only on purpose — its `index.html` canonicalises to `pridemap.net`, so the mirror does not compete with the canonical site for the same content.

## Forking and deploying

A few things to check if you fork the project or deploy it under a different name or host.

- **Base path.** `vite.config.js` sets `base: '/pridemap/'`. This must match the path your site is served from. For a GitHub Pages project site at `https://<user>.github.io/<repo>/`, set this to `'/<repo>/'`. For a custom domain or root deployment, set it to `'/'`.
- **Font paths.** The Gilbert `@font-face` rules are injected at runtime in `src/main.jsx` using `import.meta.env.BASE_URL`, so they follow the base path automatically. The prerendered static pages, however, reference `/fonts/...` absolutely — they are only generated for the root-served canonical build, so change that in `scripts/prerender.mjs` if you serve them from a subpath.
- **Deploy targets.** `pnpm run deploy` pushes `dist/` to the `gh-pages` branch; `pnpm run deploy:hostinger` builds with `--base=/`, prerenders the static pages and pushes to the `hostinger` branch. Both use the `gh-pages` package, so make sure the repository has Pages enabled and pointed at the right branch.
- **`gh-pages` cache.** If a deploy fails with `fatal: a branch named '<branch>' already exists`, the package's clone cache is stale. Clear it with `rm -rf node_modules/.cache/gh-pages` (or `npx gh-pages-clean`) and deploy again.
- **Canonical domain.** `index.html` and every prerendered page canonicalise to `https://pridemap.net`. If you fork this, change `ORIGIN` in `scripts/lib/pages.mjs` and the `canonical`/OG tags in `index.html`, otherwise you are pointing search engines at someone else's site.
- **HERE API key.** The HERE key is read from `import.meta.env.VITE_HERE_API_KEY` at build time and ends up in the bundled JavaScript. This is unavoidable for a static site. Use a key with referrer or domain restrictions configured in the HERE developer portal, and rotate it if it leaks.
- **Tile source attribution.** CartoDB requires attribution. MapLibre injects the attribution control automatically; do not remove it.
- **Analytics.** The current build includes a GoatCounter snippet (look in `index.html`). Replace or remove it before deploying under your own name.
- **Geolocation requires HTTPS.** The "near me" button will not prompt for permission on `http://` origins other than `localhost`.
- **Browser support.** The app targets evergreen browsers. WebGL is required for the map.

## Credits and tools used

- Map tiles: [CartoDB Dark Matter](https://carto.com/basemaps).
- Map rendering: [MapLibre GL JS](https://maplibre.org/), an open source fork of Mapbox GL.
- Country flag icons: [flag-icons](https://github.com/lipis/flag-icons) by Panayiotis Lipiridis.
- UI icons: [Lucide](https://lucide.dev).
- Polyline decoding for isochrones: [@here/flexpolyline](https://github.com/heremaps/flexible-polyline).
- Geocoding for new Prides: [Nominatim](https://nominatim.org/) by the OpenStreetMap project.
- Country LGBTQ+ legal scores: [ILGA Europe Rainbow Index](https://rainbow-europe.org/).
- Pride colours and the Gilbert typeface created in memory of Gilbert Baker.
- Display font: [Gilbert](https://www.typewithpride.com/) by Type With Pride.
- Travel time isochrones: [HERE Routing API](https://developer.here.com/).

Built and maintained by Benedict Arya Gruber.
