# Pride Map 2026

An interactive map of Pride parades across Europe for 2026. Each event is plotted as a coloured dot whose hue encodes how soon the event is and whose size encodes how large it is. The intent is simple: make it easy to see, at a glance, which parades are coming up near you and how the calendar fills out across the continent over the year.

Live site: https://decentbi.github.io/pridemap/

## Purpose

Pride parades happen across hundreds of European cities every year, but information about them is scattered across local sites, social media, and word of mouth. This project pulls that information into one place and lets you browse it spatially or as a list. It is not affiliated with any organising body; it is a hobby project built to help people find events.

## Functionality

- Map view with all events plotted on a dark CartoDB Dark Matter basemap, rendered through MapLibre GL.
- List view with search across city, region and event name, sortable by date or alphabetically.
- Filters for country, event size and timeframe (upcoming, past, all, this weekend, next weekend).
- Regional presets for Europe and DACH (Germany, Austria, Switzerland).
- Travel time isochrones (driving and cycling) from any clicked point, powered by HERE.
- A detail panel with the event date, a countdown, an "Add to Calendar" .ics download, attendance figures where available, the ILGA Rainbow Index score for the country, and links to the official site and Instagram.
- Geolocation button to fly the map to your current position.
- German and English translations.
- Shareable URLs: the active view, filters and selected event are encoded in the URL hash so a link reproduces exactly what you see.

## Tech stack

- React 18 with Vite 6 as the build tool.
- MapLibre GL JS v5 for map rendering, with CartoDB Dark Matter as the tile source.
- HERE Routing API for isochrone polygons (optional, requires an API key).
- Plain CSS, no framework, no preprocessor.
- Static deployment to GitHub Pages via `gh-pages`.

Data lives in `src/data/parades.json` and is the single source of truth at runtime. Raw inputs and a Nominatim based geocoding script live in `data/` and `scripts/prepare-data.js`.

## Caveats

Read these before relying on the data.

- **Coverage is incomplete.** The dataset is hand curated from public sources and will be missing parades, especially smaller and newer ones. If you find a gap, use the suggestion form (see below).
- **Sizes are relative, not absolute.** "Small", "medium" and "large" are relative buckets across the European set, not strict attendance thresholds. A "large" event in a small country may be smaller than a "small" event in a major capital.
- **Attendance numbers are approximate.** Where attendance figures are shown, they come from either local authorities or organisers, with the source labelled on the chip. The two sources often disagree, sometimes by a wide margin.
- **Dates can shift.** Some 2026 dates are confirmed by organisers; others are projected from prior years. Always check the official site (linked on the detail panel) before making travel plans.
- **The ILGA Rainbow Index is a country level score**, not a measure of how welcoming a specific city or event is. Local context can differ sharply from the national score.
- **Isochrones are best effort.** Travel time bands depend on routing data quality, traffic models and the HERE network for that region. Treat them as a rough guide, not a guarantee.

## Suggesting events

If a parade is missing or a detail is wrong, the fastest way to get it fixed is the suggestion form linked in the footer of the app: https://forms.gle/oo6vk3QfANXskXku8. Pull requests against `src/data/parades.json` are also welcome.

## Local development

```
npm install
npm run dev
```

To rebuild the parade dataset from the raw German language source JSON in `data/`, set up a `.env` with a Nominatim contact email and run:

```
npm run prepare-data
```

For isochrones, create a `.env` with `VITE_HERE_API_KEY=<your key>`. Without it, the isochrone panel is visible but inactive.

## Forking and deploying

A few things to check if you fork the project or deploy it under a different name or host.

- **Base path.** `vite.config.js` sets `base: '/pridemap/'`. This must match the path your site is served from. For a GitHub Pages project site at `https://<user>.github.io/<repo>/`, set this to `'/<repo>/'`. For a custom domain or root deployment, set it to `'/'`.
- **Font paths are absolute.** `src/styles/main.css` references the Gilbert font at `/pridemap/fonts/...`. If you change the base path, update those `@font-face` URLs to match, or refactor them to use a relative path.
- **GitHub Pages deploy target.** `npm run deploy` pushes the contents of `dist/` to the `gh-pages` branch via the `gh-pages` package. Make sure your repository has GitHub Pages enabled and pointed at the `gh-pages` branch.
- **HERE API key.** The HERE key is read from `import.meta.env.VITE_HERE_API_KEY` at build time and ends up in the bundled JavaScript. This is unavoidable for a static site. Use a key with referrer or domain restrictions configured in the HERE developer portal, and rotate it if it leaks.
- **Tile source attribution.** CartoDB requires attribution. MapLibre injects the attribution control automatically; do not remove it.
- **Analytics.** The current build includes a GoatCounter snippet (look in `index.html`). Replace or remove it before deploying under your own name.
- **Geolocation requires HTTPS.** The "near me" button will not prompt for permission on `http://` origins other than `localhost`.
- **Browser support.** The app targets evergreen browsers. WebGL is required for the map.

## Credits and tools used

- Map tiles: [CartoDB Dark Matter](https://carto.com/basemaps).
- Map rendering: [MapLibre GL JS](https://maplibre.org/), an open source fork of Mapbox GL.
- Country flag icons: [flag-icons](https://github.com/lipis/flag-icons) by Panayiotis Lipiridis.
- UI icons: [Lucide](https://lucide.dev) and [React Icons](https://react-icons.github.io/react-icons/).
- Polyline decoding for isochrones: [@here/flexpolyline](https://github.com/heremaps/flexible-polyline).
- Geocoding for the data pipeline: [Nominatim](https://nominatim.org/) by the OpenStreetMap project.
- Country LGBTQ+ legal scores: [ILGA Europe Rainbow Index](https://rainbow-europe.org/).
- Pride colours and the Gilbert typeface created in memory of Gilbert Baker.
- Display font: [Gilbert](https://www.typewithpride.com/) by Type With Pride.
- Travel time isochrones: [HERE Routing API](https://developer.here.com/).

Built and maintained by Benedict Arya Gruber.
