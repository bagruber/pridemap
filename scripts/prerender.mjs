// Build-time prerenderer: writes a crawlable static page per event and per
// hub (country / month) in both languages, plus the sitemap.
//
// Only runs for the canonical deployment (base "/"). The GitHub Pages mirror
// keeps the SPA alone so the two copies don't compete as duplicate content.
import fs from 'fs'
import path from 'path'
import {
  ORIGIN, LANGS, YEAR, buildSlugMap, eventPath, eventUrl, absolute, appLink,
  ogImagePath, countryHubSlug, monthHubSlug, hubPath, MONTHS, countryName,
  TOKENS, PRIDE_GRADIENT,
  cityName, formatDate, SIZE_LABEL, T, escapeHtml, isFirstTime,
} from './lib/pages.mjs'

const DIST = './dist'
const parades = JSON.parse(fs.readFileSync('./src/data/parades.json', 'utf8'))
const attendance = JSON.parse(fs.readFileSync('./src/data/attendance.json', 'utf8'))
const attendanceBy = Object.fromEntries(attendance.map(a => [a.city, a]))
const slugs = buildSlugMap(parades)

const write = (rel, html) => {
  const file = path.join(DIST, rel, 'index.html')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, html)
}

// Share images live outside public/ so only this build ships them
function copyShareImages() {
  const src = './og-cache'
  if (!fs.existsSync(src)) {
    console.warn('Share images: og-cache/ missing — run `npm run og` (pages will show broken previews).')
    return 0
  }
  const dest = path.join(DIST, 'og')
  fs.mkdirSync(dest, { recursive: true })
  const files = fs.readdirSync(src).filter(f => f.endsWith('.jpg'))
  for (const f of files) fs.copyFileSync(path.join(src, f), path.join(dest, f))
  return files.length
}

const fmtBucket = n =>
  n >= 1e6 ? `≥${(n / 1e6).toLocaleString('en')}M`
  : n >= 1e3 ? `≥${(n / 1e3).toLocaleString('en')}k`
  : `≥${n.toLocaleString('en')}`

// ── Shared chrome ────────────────────────────────────────────────────────────
const STYLE = `
:root{--bg:${TOKENS.bg};--surface:${TOKENS.surface};--surface2:${TOKENS.surface2};--border:${TOKENS.border};--text:${TOKENS.text};--muted:${TOKENS.muted};--dim:${TOKENS.dimUi};--accent:${TOKENS.accent};--premiere:${TOKENS.premiere}}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@font-face{font-family:'Gilbert';src:url('/fonts/GilbertColorBold.otf') format('opentype');font-weight:700;font-display:swap}
body{background:var(--bg);color:var(--text);font:16px/1.6 'Sofia Sans',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}
.wrap{max-width:760px;margin:0 auto;padding:24px 20px 64px}
/* Measure caps only the prose; lists and the hero keep the full column */
.lede,footer p,dd{max-width:68ch}
.top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:28px}
.brand{font-family:'Gilbert',Georgia,serif;font-size:20px;font-weight:700;text-decoration:none;background:${PRIDE_GRADIENT};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.langs{display:flex;gap:6px;font-size:12px}
.langs a{padding:3px 9px;border:1px solid var(--border);border-radius:4px;color:var(--muted);text-decoration:none}
.langs a[aria-current]{background:#fff;border-color:#fff;color:#111;font-weight:600}
.hero{width:100%;height:auto;aspect-ratio:1200/630;border-radius:8px;border:1px solid var(--border);margin-bottom:22px;display:block;background:var(--surface)}
.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--premiere);background:rgba(255,212,71,.12);border:1px solid rgba(255,212,71,.45);margin-bottom:10px}
h1{font-size:34px;line-height:1.15;letter-spacing:-.5px;margin-bottom:8px;font-weight:700}
.lede{color:var(--muted);font-size:17px;margin-bottom:24px}
dl{display:grid;grid-template-columns:auto 1fr;gap:8px 18px;margin-bottom:24px;font-size:15px}
dt{color:var(--muted);font-size:13px;text-transform:uppercase;letter-spacing:.6px;padding-top:3px}
dd{font-weight:600}
.sub{font-weight:400;color:var(--muted);font-size:13px}
.bar{height:6px;background:var(--surface2);border-radius:3px;overflow:hidden;max-width:220px;margin-top:6px}
.bar i{display:block;height:100%;border-radius:3px}
.btns{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px}
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:24px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:14px;text-decoration:none}
.btn:hover{border-color:var(--dim)}
.btn-primary{background:#fff;border-color:#fff;color:#111;font-weight:600}
.btn-ig{border-color:#c13584;color:#e879bd}
section h2{font-size:15px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin:32px 0 12px;font-weight:700}
ul.list{list-style:none;border:1px solid var(--border);border-radius:8px;overflow:hidden}
ul.list li+li{border-top:1px solid var(--border)}
ul.list a{display:flex;align-items:center;gap:10px;padding:11px 14px;text-decoration:none;font-size:14px}
ul.list a:hover{background:var(--surface)}
ul.list .c{flex:1;font-weight:600}
ul.list .r{color:var(--muted);font-size:12px;font-weight:400}
ul.list .d{color:var(--muted);font-size:13px;white-space:nowrap}
.pill{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--premiere);background:rgba(255,212,71,.12);border:1px solid rgba(255,212,71,.4);border-radius:10px;padding:1px 6px}
.chips{display:flex;flex-wrap:wrap;gap:7px}
.chips a{padding:6px 12px;border:1px solid var(--border);border-radius:20px;font-size:13px;color:var(--muted);text-decoration:none}
.chips a:hover{border-color:var(--dim);color:var(--text)}
footer{margin-top:48px;padding-top:20px;border-top:1px solid var(--border);color:var(--muted);font-size:12px}
footer p{margin-bottom:8px}
footer a{color:var(--muted)}
@media(max-width:560px){h1{font-size:27px}dl{grid-template-columns:1fr;gap:2px 0}dt{margin-top:10px}}
`.trim()

function shell({ lang, title, description, canonical, alternates, image, jsonld, body }) {
  const alt = alternates.map(a =>
    `<link rel="alternate" hreflang="${a.lang}" href="${a.href}">`).join('\n  ')
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="icon" type="image/png" href="/favicon_pridemap.png">
  <link rel="canonical" href="${canonical}">
  ${alt}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Pride Map 2026">
  <meta property="og:locale" content="${lang === 'de' ? 'de_DE' : 'en_US'}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${image}">
  <style>${STYLE}</style>
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
  <div class="wrap">
${body}
  </div>
</body>
</html>`
}

function chrome(lang, alternates) {
  const t = T[lang]
  const langLinks = LANGS.map(l => {
    const href = alternates.find(a => a.lang === l)?.href ?? `${ORIGIN}/${l}/`
    return `<a href="${href}"${l === lang ? ' aria-current="true"' : ''}>${l.toUpperCase()}</a>`
  }).join('')
  return `    <div class="top">
      <a class="brand" href="${ORIGIN}/">pride map ${YEAR}</a>
      <nav class="langs">${langLinks}</nav>
    </div>`
}

function footer(lang) {
  const t = T[lang]
  return `    <footer>
      <p>${escapeHtml(t.disclaimer)}</p>
      <p><a href="${ORIGIN}/">${escapeHtml(t.backToMap)}</a></p>
    </footer>`
}

const rowsFor = (lang, list) => list.map(p => {
  const s = slugs.get(p.id)
  const first = isFirstTime(p)
  return `        <li><a href="${eventPath(lang, s)}">
          <span class="c">${escapeHtml(cityName(lang, p.city))}${first ? ` <span class="pill">${escapeHtml(T[lang].firstEdition)}</span>` : ''}${p.region ? ` <span class="r">${escapeHtml(p.region)}</span>` : ''}</span>
          <span class="d">${escapeHtml(formatDate(lang, p.date, { weekday: false }))}</span>
        </a></li>`
}).join('\n')

// ── Event pages ──────────────────────────────────────────────────────────────
function eventPage(p, lang) {
  const t = T[lang]
  const slug = slugs.get(p.id)
  const city = cityName(lang, p.city)
  const country = countryName(lang, p.country)
  const first = isFirstTime(p)
  const dateLong = formatDate(lang, p.date)
  const att = attendanceBy[p.city]
  const image = absolute(ogImagePath(slug))
  const alternates = [
    ...LANGS.map(l => ({ lang: l, href: eventUrl(l, slug) })),
    { lang: 'x-default', href: eventUrl('en', slug) },
  ]

  const title = lang === 'de'
    ? `${p.name} – Termin, Ort & Infos | Pride Map`
    : `${p.name} – Date, Location & Info | Pride Map`
  const description = lang === 'de'
    ? `${p.name} findet am ${dateLong} in ${city}${p.region ? ` (${p.region})` : ''}, ${country} statt.${first ? ' Premiere – der erste CSD in dieser Stadt.' : ''} Termin, Karte und alle Infos.`
    : `${p.name} takes place on ${dateLong} in ${city}${p.region ? ` (${p.region})` : ''}, ${country}.${first ? ' First edition – this city’s debut Pride.' : ''} Date, map and all the details.`

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Event',
        name: p.name,
        startDate: p.date,
        endDate: p.date,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        url: eventUrl(lang, slug),
        image,
        description,
        inLanguage: lang,
        isAccessibleForFree: true,
        location: {
          '@type': 'Place',
          name: city,
          address: {
            '@type': 'PostalAddress',
            addressLocality: city,
            ...(p.region ? { addressRegion: p.region } : {}),
            addressCountry: p.country,
          },
          ...(p.lat != null && p.lon != null
            ? { geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lon } }
            : {}),
        },
        ...(p.website ? { organizer: { '@type': 'Organization', name: p.name, url: p.website } } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: T[lang].siteName, item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: country, item: absolute(hubPath(lang, countryHubSlug(lang, p.country))) },
          { '@type': 'ListItem', position: 3, name: p.name, item: eventUrl(lang, slug) },
        ],
      },
    ],
  }

  const sameCountry = parades
    .filter(x => x.country === p.country && x.id !== p.id)
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10)
  const month = Number(p.date.slice(5, 7))
  const sameMonth = parades
    .filter(x => Number(x.date.slice(5, 7)) === month && x.country !== p.country)
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10)

  const rows = []
  rows.push(`<dt>${escapeHtml(t.dateLabel)}</dt><dd>${escapeHtml(dateLong)}</dd>`)
  rows.push(`<dt>${escapeHtml(t.whereLabel)}</dt><dd>${escapeHtml(city)}${p.region ? `, ${escapeHtml(p.region)}` : ''}<span class="sub"> · ${escapeHtml(country)}</span></dd>`)
  rows.push(`<dt>${escapeHtml(t.sizeLabel)}</dt><dd>${escapeHtml(SIZE_LABEL[lang][p.size] ?? p.size)}</dd>`)
  if (att) {
    const src = att.source === 'authorities' ? t.sourceAuthorities
      : att.source === 'organizers' ? t.sourceOrganizers : ''
    rows.push(`<dt>${escapeHtml(t.attendanceLabel)}</dt><dd>${fmtBucket(att.bucket)} ${escapeHtml(t.visitorsSuffix)}<span class="sub"> (${att.year ?? '?'}${src ? ` · ${escapeHtml(src)}` : ''})</span></dd>`)
  }
  if (p.queerIndex != null) {
    const col = p.queerIndex >= 70 ? '#34C759' : p.queerIndex >= 50 ? '#FFD700' : p.queerIndex >= 30 ? '#FF9500' : '#FF2D78'
    rows.push(`<dt>${escapeHtml(t.ilga)}</dt><dd>${p.queerIndex}%<div class="bar"><i style="width:${p.queerIndex}%;background:${col}"></i></div></dd>`)
  }

  const btns = [`<a class="btn btn-primary" href="${appLink(p.id)}">${escapeHtml(t.openOnMap)}</a>`]
  if (p.website) btns.push(`<a class="btn" href="${escapeHtml(p.website)}" target="_blank" rel="noopener">${escapeHtml(t.officialSite)}</a>`)
  if (p.instagram) btns.push(`<a class="btn btn-ig" href="${escapeHtml(p.instagram)}" target="_blank" rel="noopener">${escapeHtml(t.instagram)}</a>`)

  const body = `${chrome(lang, alternates)}
    <main>
      <img class="hero" src="${ogImagePath(slug)}" alt="${escapeHtml(p.name)} — ${escapeHtml(city)}, ${escapeHtml(country)}" width="1200" height="630" loading="eager">
      ${first ? `<div class="badge">✨ ${escapeHtml(t.firstEdition)}</div>` : ''}
      <h1>${escapeHtml(p.name)}</h1>
      <p class="lede">${escapeHtml(description)}</p>
      <dl>${rows.join('')}</dl>
      <div class="btns">${btns.join('')}</div>
      ${sameCountry.length ? `<section><h2>${escapeHtml(t.moreIn(country))}</h2><ul class="list">\n${rowsFor(lang, sameCountry)}\n      </ul></section>` : ''}
      ${sameMonth.length ? `<section><h2>${escapeHtml(t.sameMonth(MONTHS[lang][month - 1]))}</h2><ul class="list">\n${rowsFor(lang, sameMonth)}\n      </ul></section>` : ''}
    </main>
${footer(lang)}`

  return shell({ lang, title, description, canonical: eventUrl(lang, slug), alternates, image, jsonld, body })
}

// ── Hub pages ────────────────────────────────────────────────────────────────
function hubPage({ lang, slug, altSlugs, title, description, heading, intro, list, chips }) {
  const alternates = [
    ...LANGS.map(l => ({ lang: l, href: absolute(hubPath(l, altSlugs[l])) })),
    { lang: 'x-default', href: absolute(hubPath('en', altSlugs.en)) },
  ]
  const t = T[lang]
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: heading,
    numberOfItems: list.length,
    itemListElement: list.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: eventUrl(lang, slugs.get(p.id)),
      name: p.name,
    })),
  }
  const body = `${chrome(lang, alternates)}
    <main>
      <h1>${escapeHtml(heading)}</h1>
      <p class="lede">${escapeHtml(intro)}</p>
      <ul class="list">
${rowsFor(lang, list)}
      </ul>
      ${chips ? `<section><h2>${escapeHtml(lang === 'de' ? 'Weiter stöbern' : 'Keep browsing')}</h2><div class="chips">${chips}</div></section>` : ''}
      <div class="btns" style="margin-top:28px"><a class="btn btn-primary" href="${ORIGIN}/">${escapeHtml(t.allEvents)}</a></div>
    </main>
${footer(lang)}`
  return shell({
    lang, title, description,
    canonical: absolute(hubPath(lang, slug)),
    alternates, image: absolute('/og-image.png'), jsonld, body,
  })
}

// ── Generate ─────────────────────────────────────────────────────────────────
const urls = []            // { path, alternates: {de,en} }
const addUrl = (paths, priority) => urls.push({ paths, priority })

for (const p of parades) {
  const slug = slugs.get(p.id)
  for (const lang of LANGS) write(eventPath(lang, slug), eventPage(p, lang))
  addUrl(Object.fromEntries(LANGS.map(l => [l, eventPath(l, slug)])), '0.8')
}

const countries = [...new Set(parades.map(p => p.country))].sort()
const months = [...new Set(parades.map(p => Number(p.date.slice(5, 7))))].sort((a, b) => a - b)

// chips linking the hubs together
const monthChips = lang => months.map(m =>
  `<a href="${hubPath(lang, monthHubSlug(lang, m))}">${escapeHtml(MONTHS[lang][m - 1])}</a>`).join('')
const countryChips = lang => countries.map(c =>
  `<a href="${hubPath(lang, countryHubSlug(lang, c))}">${escapeHtml(countryName(lang, c))}</a>`).join('')

for (const code of countries) {
  const list = parades.filter(p => p.country === code).sort((a, b) => a.date.localeCompare(b.date))
  const altSlugs = Object.fromEntries(LANGS.map(l => [l, countryHubSlug(l, code)]))
  for (const lang of LANGS) {
    const cn = countryName(lang, code)
    const heading = lang === 'de'
      ? `Pride & CSD Termine ${cn} ${YEAR}`
      : `Pride parades in ${cn} ${YEAR}`
    write(hubPath(lang, altSlugs[lang]), hubPage({
      lang, slug: altSlugs[lang], altSlugs,
      title: `${heading} – alle ${list.length} Termine | Pride Map`.replace('alle', lang === 'de' ? 'alle' : 'all'),
      description: lang === 'de'
        ? `Alle ${list.length} Pride-Paraden und CSD-Termine in ${cn} ${YEAR} — mit Datum, Ort und Karte.`
        : `All ${list.length} Pride parades in ${cn} in ${YEAR} — with dates, locations and a map.`,
      heading, intro: lang === 'de'
        ? `${list.length} Termine in ${cn}. Sortiert nach Datum.`
        : `${list.length} dates in ${cn}, sorted by date.`,
      list, chips: monthChips(lang),
    }))
  }
  addUrl(Object.fromEntries(LANGS.map(l => [l, hubPath(l, altSlugs[l])])), '0.7')
}

for (const m of months) {
  const list = parades.filter(p => Number(p.date.slice(5, 7)) === m).sort((a, b) => a.date.localeCompare(b.date))
  const altSlugs = Object.fromEntries(LANGS.map(l => [l, monthHubSlug(l, m)]))
  for (const lang of LANGS) {
    const mn = MONTHS[lang][m - 1]
    const heading = lang === 'de'
      ? `CSD & Pride Termine ${mn} ${YEAR}`
      : `Pride parades in ${mn} ${YEAR}`
    write(hubPath(lang, altSlugs[lang]), hubPage({
      lang, slug: altSlugs[lang], altSlugs,
      title: `${heading} – ${list.length} Termine in Europa | Pride Map`,
      description: lang === 'de'
        ? `Alle ${list.length} CSD- und Pride-Termine im ${mn} ${YEAR} in Europa — mit Datum, Ort und Karte.`
        : `All ${list.length} Pride parades across Europe in ${mn} ${YEAR} — with dates, locations and a map.`,
      heading, intro: lang === 'de'
        ? `${list.length} Termine in ganz Europa im ${mn} ${YEAR}.`
        : `${list.length} dates across Europe in ${mn} ${YEAR}.`,
      list, chips: countryChips(lang),
    }))
  }
  addUrl(Object.fromEntries(LANGS.map(l => [l, hubPath(l, altSlugs[l])])), '0.7')
}

// Language index pages tie the hubs together for crawlers
for (const lang of LANGS) {
  const alternates = [
    ...LANGS.map(l => ({ lang: l, href: `${ORIGIN}/${l}/` })),
    { lang: 'x-default', href: `${ORIGIN}/en/` },
  ]
  const heading = lang === 'de'
    ? `Pride & CSD Termine ${YEAR} in Europa`
    : `Pride parades ${YEAR} across Europe`
  const body = `${chrome(lang, alternates)}
    <main>
      <h1>${escapeHtml(heading)}</h1>
      <p class="lede">${escapeHtml(T[lang].aboutMap)}</p>
      <section><h2>${escapeHtml(lang === 'de' ? 'Nach Monat' : 'By month')}</h2><div class="chips">${monthChips(lang)}</div></section>
      <section><h2>${escapeHtml(lang === 'de' ? 'Nach Land' : 'By country')}</h2><div class="chips">${countryChips(lang)}</div></section>
      <div class="btns" style="margin-top:28px"><a class="btn btn-primary" href="${ORIGIN}/">${escapeHtml(T[lang].allEvents)}</a></div>
    </main>
${footer(lang)}`
  write(`/${lang}/`, shell({
    lang,
    title: `${heading} – ${parades.length} Termine | Pride Map`,
    description: T[lang].aboutMap,
    canonical: `${ORIGIN}/${lang}/`,
    alternates, image: absolute('/og-image.png'),
    jsonld: {
      '@context': 'https://schema.org', '@type': 'CollectionPage',
      name: heading, url: `${ORIGIN}/${lang}/`, inLanguage: lang,
    },
    body,
  }))
  addUrl(Object.fromEntries(LANGS.map(l => [l, `/${l}/`])), '0.9')
}

// ── Sitemap ──────────────────────────────────────────────────────────────────
const lastmod = new Date().toISOString().slice(0, 10)
const entries = [
  `  <url>
    <loc>${ORIGIN}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,
  ...urls.flatMap(({ paths, priority }) =>
    LANGS.map(lang => {
      const alts = [
        ...LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${absolute(paths[l])}"/>`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${absolute(paths.en)}"/>`,
      ].join('\n')
      return `  <url>
    <loc>${absolute(paths[lang])}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
${alts}
  </url>`
    })),
].join('\n')

fs.writeFileSync(`${DIST}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>`)

// ── Homepage JSON-LD: events now point at their own pages ────────────────────
const today = new Date(); today.setHours(0, 0, 0, 0)
const upcoming = parades
  .filter(p => new Date(p.date) >= today)
  .sort((a, b) => a.date.localeCompare(b.date))
const homeJsonld = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Pride Map 2026',
      url: `${ORIGIN}/`,
      description: 'Interactive map and calendar of 600+ LGBTQ+ Pride parades across Europe in 2026.',
      inLanguage: ['en', 'de'],
    },
    ...upcoming.map(p => ({
      '@type': 'Event',
      name: p.name || `${p.city} Pride`,
      startDate: p.date,
      url: eventUrl('en', slugs.get(p.id)),
      image: absolute(ogImagePath(slugs.get(p.id))),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: p.city,
        address: { '@type': 'PostalAddress', addressLocality: p.city, addressCountry: p.country },
        ...(p.lat != null ? { geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lon } } : {}),
      },
    })),
  ],
})
const indexPath = `${DIST}/index.html`
fs.writeFileSync(indexPath, fs.readFileSync(indexPath, 'utf8')
  .replace('</body>', `<script type="application/ld+json">${homeJsonld}</script>\n</body>`))

const imageCount = copyShareImages()

const pageCount = urls.length * LANGS.length
console.log(`Prerender: ${parades.length} events × ${LANGS.length} langs, ${countries.length} country hubs, ${months.length} month hubs`)
console.log(`Share images: ${imageCount} copied to dist/og/`)
console.log(`Sitemap: ${pageCount + 1} URLs with hreflang, lastmod ${lastmod}`)
console.log(`JSON-LD: ${upcoming.length} upcoming events on the homepage`)
