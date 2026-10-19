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
  TOKENS, PRIDE_GRADIENT, slugify,
  cityName, formatDate, SIZE_LABEL, T, escapeHtml, isFirstTime,
  localPride, displayAka, joinOr,
} from './lib/pages.mjs'

const DIST = './dist'
import { loadPrides, newestAttendance } from './lib/data.mjs'

const parades = loadPrides()
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
@font-face{font-family:'Gilbert';src:url('/fonts/GilbertBold.otf') format('opentype');font-weight:700;font-display:swap}
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
.badge{display:block;font-size:13px;font-weight:600;color:var(--premiere);margin-bottom:8px}
.badge-moved{color:var(--accent);background:rgba(255,45,120,.12);border-color:rgba(255,45,120,.45)}
h1{font-size:34px;line-height:1.15;letter-spacing:-.5px;margin-bottom:8px;font-weight:700}
.lede{color:var(--muted);font-size:17px;margin-bottom:24px}
.aka{color:var(--muted);font-size:14px;margin:-14px 0 24px}
dl{display:grid;grid-template-columns:auto 1fr;gap:8px 18px;margin-bottom:24px;font-size:15px}
dt{color:var(--muted);font-size:14px;padding-top:3px}
dd{font-weight:600}
.sub{font-weight:400;color:var(--muted);font-size:13px}
.bar{height:6px;background:var(--surface2);border-radius:3px;overflow:hidden;max-width:220px;margin-top:6px}
.bar i{display:block;height:100%;border-radius:3px}
.btns{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px}
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:24px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:14px;text-decoration:none}
.btn:hover{border-color:var(--dim)}
.btn-primary{background:#fff;border-color:#fff;color:#111;font-weight:600}
.btn-ig{border-color:#c13584;color:#e879bd}
section h2{font-size:17px;color:var(--text);margin:32px 0 12px;font-weight:700}
ul.list{list-style:none;border:1px solid var(--border);border-radius:8px;overflow:hidden}
ul.list li+li{border-top:1px solid var(--border)}
ul.list a{display:flex;align-items:center;gap:10px;padding:11px 14px;text-decoration:none;font-size:14px}
ul.list a:hover{background:var(--surface)}
ul.list .c{flex:1;font-weight:600}
ul.list .r{color:var(--muted);font-size:12px;font-weight:400}
ul.list .d{color:var(--muted);font-size:13px;white-space:nowrap}
.pill{font-size:12px;font-weight:600;color:var(--premiere)}
.pill-moved{color:var(--accent);background:rgba(255,45,120,.12);border-color:rgba(255,45,120,.4)}
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
  <meta property="og:site_name" content="Pride Map ${YEAR}">
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
          <span class="c">${escapeHtml(cityName(lang, p))}${first ? ` <span class="pill">${escapeHtml(T[lang].firstEdition)}</span>` : ''}${p.movedFrom ? ` <span class="pill pill-moved">${escapeHtml(T[lang].rescheduled)}</span>` : ''}${p.region ? ` <span class="r">${escapeHtml(p.region)}</span>` : ''}</span>
          <span class="d${p.open ? ' d-open' : ''}">${p.open ? escapeHtml(T[lang].dateOpenShort) : escapeHtml(formatDate(lang, p.date, { weekday: false }))}</span>
        </a></li>`
}).join('\n')

// ── Event pages ──────────────────────────────────────────────────────────────
function eventPage(p, lang) {
  const t = T[lang]
  const slug = slugs.get(p.id)
  const city = cityName(lang, p)
  const country = countryName(lang, p.country)
  const first = isFirstTime(p)
  const dateLong = p.open ? null : formatDate(lang, p.date)
  const lastLong = p.lastDate ? formatDate(lang, p.lastDate) : null
  const movedLong = p.movedFrom ? formatDate(lang, p.movedFrom) : null
  // The badge and the meta description get the weekday-less form: both are
  // length-constrained, and the full date already sits in the definition list.
  const movedShort = p.movedFrom ? formatDate(lang, p.movedFrom, { weekday: false }) : null
  const aka = displayAka(p.country)
  const att = newestAttendance(p)
  const image = absolute(ogImagePath(slug))
  const alternates = [
    ...LANGS.map(l => ({ lang: l, href: eventUrl(l, slug) })),
    { lang: 'x-default', href: eventUrl('en', slug) },
  ]

  const title = lang === 'de'
    ? `${p.name} – Termin, Ort & Infos | Pride Map`
    : `${p.name} – Date, Location & Info | Pride Map`
  const where = `${city}${p.region ? ` (${p.region})` : ''}, ${country}`
  const description = p.open
    ? (lang === 'de'
      ? `${p.name} in ${where}. Der Termin ${p.year} steht noch nicht fest.${lastLong ? ` ${p.lastYear} war es der ${lastLong}.` : ''} Sobald er bekannt ist, steht er hier.`
      : `${p.name} in ${where}. The ${p.year} date is not announced yet.${lastLong ? ` In ${p.lastYear} it was ${lastLong}.` : ''} It will appear here as soon as it is.`)
    : (lang === 'de'
      ? `${p.name} findet am ${dateLong} in ${where} statt.${movedShort ? ` ${t.movedFrom(movedShort)}.` : ''}${first ? ' Premiere – der erste CSD in dieser Stadt.' : ''} Termin, Karte und alle Infos.`
      : `${p.name} takes place on ${dateLong} in ${where}.${movedShort ? ` ${t.movedFrom(movedShort)}.` : ''}${first ? ' First edition – this city’s debut Pride.' : ''} Date, map and all the details.`)

  // schema.org Event needs a startDate. A Pride whose date is open gets only
  // the breadcrumb — an invented date would be worse than none.
  const eventNode = p.open ? null : {
        '@type': 'Event',
        name: p.name,
        startDate: p.date,
        endDate: p.date,
        // Google reads EventRescheduled + previousStartDate to update a date it
        // has already indexed, instead of treating the new one as a second event.
        eventStatus: p.movedFrom
          ? 'https://schema.org/EventRescheduled'
          : 'https://schema.org/EventScheduled',
        ...(p.movedFrom ? { previousStartDate: p.movedFrom } : {}),
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
  }

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      ...(eventNode ? [eventNode] : []),
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

  // Dated neighbours first; a list of "date unknown" helps nobody browse
  const sameCountry = parades
    .filter(x => x.country === p.country && x.id !== p.id && !x.open)
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10)
  const month = p.open ? null : Number(p.date.slice(5, 7))
  const sameMonth = month == null ? [] : parades
    .filter(x => !x.open && Number(x.date.slice(5, 7)) === month && x.country !== p.country)
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10)

  const rows = []
  rows.push(p.open
    ? `<dt>${escapeHtml(t.dateLabel)}</dt><dd>${escapeHtml(t.dateOpen(p.year))}${lastLong ? `<span class="sub"> · ${escapeHtml(t.lastHeld(p.lastYear, lastLong))}</span>` : ''}</dd>`
    : `<dt>${escapeHtml(t.dateLabel)}</dt><dd>${escapeHtml(dateLong)}${movedLong ? `<span class="sub"> · <s>${escapeHtml(movedLong)}</s></span>` : ''}</dd>`)
  rows.push(`<dt>${escapeHtml(t.whereLabel)}</dt><dd>${escapeHtml(city)}${p.region ? `, ${escapeHtml(p.region)}` : ''}<span class="sub"> · ${escapeHtml(country)}</span></dd>`)
  rows.push(`<dt>${escapeHtml(t.sizeLabel)}</dt><dd>${escapeHtml(SIZE_LABEL[lang][p.size] ?? p.size)}</dd>`)
  if (att) {
    const src = att.by === 'authorities' ? t.sourceAuthorities
      : att.by === 'organizers' ? t.sourceOrganizers : ''
    rows.push(`<dt>${escapeHtml(t.attendanceLabel)}</dt><dd>${fmtBucket(att.count)} ${escapeHtml(t.visitorsSuffix)}<span class="sub"> (${att.year ?? '?'}${src ? ` · ${escapeHtml(src)}` : ''})</span></dd>`)
  }
  if (p.queerIndex != null) {
    const col = p.queerIndex >= 70 ? '#34C759' : p.queerIndex >= 50 ? '#FFD700' : p.queerIndex >= 30 ? '#FF9500' : '#FF2D78'
    rows.push(`<dt>${escapeHtml(t.ilga)}</dt><dd>${p.queerIndex}%<div class="bar"><i style="width:${p.queerIndex}%;background:${col}"></i></div></dd>`)
  }

  // Everything this Pride has done before, newest first — the reason it has a
  // permanent page at all.
  const earlier = (p.editions ?? [])
    .filter(e => e.date && e.date !== p.date)
    .sort((a, b) => b.date.localeCompare(a.date))
  const attByYear = Object.fromEntries((p.attendance ?? []).map(a => [a.year, a]))

  const btns = [`<a class="btn btn-primary" href="${appLink(p.id)}">${escapeHtml(t.openOnMap)}</a>`]
  if (p.website) btns.push(`<a class="btn" href="${escapeHtml(p.website)}" target="_blank" rel="noopener">${escapeHtml(t.officialSite)}</a>`)
  if (p.instagram) btns.push(`<a class="btn btn-ig" href="${escapeHtml(p.instagram)}" target="_blank" rel="noopener">${escapeHtml(t.instagram)}</a>`)

  const body = `${chrome(lang, alternates)}
    <main>
      <img class="hero" src="${ogImagePath(slug)}" alt="${escapeHtml(p.name)} — ${escapeHtml(city)}, ${escapeHtml(country)}" width="1200" height="630" loading="eager">
      ${first ? `<div class="badge">✨ ${escapeHtml(t.firstEdition)}</div>` : ''}
      ${movedShort ? `<div class="badge badge-moved">↻ ${escapeHtml(t.movedFrom(movedShort))}</div>` : ''}
      <h1>${escapeHtml(p.name)}</h1>
      <p class="lede">${escapeHtml(description)}</p>
      ${aka.length ? `<p class="aka">${escapeHtml(t.alsoCalled(joinOr(lang, aka), country))}</p>` : ''}
      <dl>${rows.join('')}</dl>
      <div class="btns">${btns.join('')}</div>
      ${earlier.length ? `<section><h2>${escapeHtml(t.earlierEditions)}</h2><ul class="list">
${earlier.map(e => {
  const a = attByYear[e.year]
  return `        <li><span class="c">${e.year}</span><span class="d">${escapeHtml(formatDate(lang, e.date, { weekday: false }))}${a ? ` · ${fmtBucket(a.count)} ${escapeHtml(t.visitorsSuffix)}` : ''}</span></li>`
}).join(String.fromCharCode(10))}
      </ul></section>` : ''}
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
// A Pride whose date is open counts towards the month it used last year, so
// the twelve month hubs stay alive through the off-season instead of
// disappearing and coming back.
const monthOf = p => Number((p.open ? p.lastDate : p.date)?.slice(5, 7)) || null
const months = [...new Set(parades.map(monthOf).filter(Boolean))].sort((a, b) => a - b)

// chips linking the hubs together
const monthChips = lang => months.map(m =>
  `<a href="${hubPath(lang, monthHubSlug(lang, m))}">${escapeHtml(MONTHS[lang][m - 1])}</a>`).join('')
const countryChips = lang => countries.map(c =>
  `<a href="${hubPath(lang, countryHubSlug(lang, c))}">${escapeHtml(countryName(lang, c))}</a>`).join('')

for (const code of countries) {
  const all = parades.filter(p => p.country === code)
  const list = [
    ...all.filter(p => !p.open).sort((a, b) => a.date.localeCompare(b.date)),
    ...all.filter(p => p.open).sort((a, b) => (a.lastDate ?? '').slice(5).localeCompare((b.lastDate ?? '').slice(5))),
  ]
  const datedCount = all.filter(p => !p.open).length
  const altSlugs = Object.fromEntries(LANGS.map(l => [l, countryHubSlug(l, code)]))
  for (const lang of LANGS) {
    const cn = countryName(lang, code)
    const label = localPride(code)?.label
    const aka = displayAka(code)
    const heading = lang === 'de'
      ? `Pride${label ? ` & ${label}` : ''} Termine ${cn} ${YEAR}`
      : `Pride parades in ${cn} ${YEAR}`
    write(hubPath(lang, altSlugs[lang]), hubPage({
      lang, slug: altSlugs[lang], altSlugs,
      title: `${heading} – alle ${list.length} Termine | Pride Map`.replace('alle', lang === 'de' ? 'alle' : 'all'),
      description: lang === 'de'
        ? `Alle ${list.length} Pride-Paraden in ${cn} ${YEAR}${label ? `, auch ${label} genannt` : ''} — mit Datum, Ort und Karte.`
        : `All ${list.length} Pride parades in ${cn} in ${YEAR}${label ? `, also known as ${label}` : ''} — with dates, locations and a map.`,
      heading, intro: lang === 'de'
        ? `${datedCount} Termine in ${cn}${list.length > datedCount ? `, bei ${list.length - datedCount} steht der Termin noch nicht fest` : ''}.${aka.length ? ` ${T.de.alsoCalled(joinOr('de', aka), cn)}` : ''}`
        : `${datedCount} dates in ${cn}${list.length > datedCount ? `, ${list.length - datedCount} still without one` : ''}.${aka.length ? ` ${T.en.alsoCalled(joinOr('en', aka), cn)}` : ''}`,
      list, chips: monthChips(lang),
    }))
  }
  addUrl(Object.fromEntries(LANGS.map(l => [l, hubPath(l, altSlugs[l])])), '0.7')
}

for (const m of months) {
  const inMonth = parades.filter(p => monthOf(p) === m)
  const list = [
    ...inMonth.filter(p => !p.open).sort((a, b) => a.date.localeCompare(b.date)),
    ...inMonth.filter(p => p.open).sort((a, b) => (a.lastDate ?? '').localeCompare(b.lastDate ?? '')),
  ]
  const datedCount = inMonth.filter(p => !p.open).length
  const altSlugs = Object.fromEntries(LANGS.map(l => [l, monthHubSlug(l, m)]))
  for (const lang of LANGS) {
    const mn = MONTHS[lang][m - 1]
    const heading = lang === 'de'
      ? `CSD & Pride Termine ${mn} ${YEAR}`
      : `Pride parades in ${mn} ${YEAR}`
    write(hubPath(lang, altSlugs[lang]), hubPage({
      lang, slug: altSlugs[lang], altSlugs,
      title: `${heading} – ${list.length} Prides in Europa | Pride Map`,
      description: lang === 'de'
        ? `Pride-Paraden und CSDs im ${mn} ${YEAR} in Europa — mit Datum, Ort und Karte.`
        : `Pride parades across Europe in ${mn} ${YEAR} — with dates, locations and a map.`,
      heading, intro: lang === 'de'
        ? `${datedCount} von ${list.length} Prides haben für den ${mn} ${YEAR} schon einen Termin.`
        : `${datedCount} of ${list.length} Prides already have a date in ${mn} ${YEAR}.`,
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
    title: `${heading} – ${parades.length} Prides | Pride Map`,
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

// ── Weiterleitungen ──────────────────────────────────────────
// The URLs lost their year with this build. Every path that was live before
// gets a page that forwards to its successor — meta refresh plus canonical,
// because that works on any host and needs no .htaccess.
const written = new Set(urls.flatMap(({ paths }) => LANGS.map(l => paths[l])))
written.add('/')
for (const lang of LANGS) written.add(`/${lang}/`)

// The old event slug was the name of the day, so the old id carries it: strip
// the trailing date off a legacy id and you have the path that was live.
const legacySlugs = new Map()
for (const p of parades) {
  for (const old of p.legacyIds ?? []) {
    legacySlugs.set(old.replace(/-(19|20)\d\d-\d\d-\d\d$/, ''), slugs.get(p.id))
  }
}

// "/de/csd-termine-juni-2026/" → "/de/csd-termine-juni/" for the hubs
const withoutYear = p => p.replace(/-(19|20)\d\d\/$/, '/')

// Last resort for the handful the id does not reach: the old slug was built
// from the old name, which transliterated umlauts where the id merely dropped
// them ("bra-ov" vs "brasov"), and sometimes ordered the words differently.
// The city survives both, so match on that — but only when exactly one Pride
// of that city fits.
const byCitySlug = new Map()
for (const p of parades) {
  const key = slugify(p.city)
  if (!key) continue
  byCitySlug.set(key, byCitySlug.has(key) ? null : p)
}

function successor(from) {
  const m = from.match(/^\/(de|en)\/(.+)\/$/)
  if (!m) return withoutYear(from)
  const [, lang, slug] = m

  const moved = legacySlugs.get(slug)
  if (moved) return `/${lang}/${moved}/`

  let best = null
  for (const [key, pride] of byCitySlug) {
    if (!pride || !slug.includes(key)) continue
    if (!best || key.length > slugify(best.city).length) best = pride
  }
  if (best) return `/${lang}/${slugs.get(best.id)}/`

  return withoutYear(from)
}

function redirectPage(from, to) {
  const abs = absolute(to)
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Pride Map</title>
<link rel="canonical" href="${abs}">
<meta name="robots" content="noindex,follow">
<meta http-equiv="refresh" content="0; url=${abs}">
<script>location.replace(${JSON.stringify(abs)})</script>
</head>
<body><p>Diese Seite ist umgezogen: <a href="${abs}">${escapeHtml(abs)}</a></p></body>
</html>`
}

let redirects = 0, orphans = 0
const legacy = fs.readFileSync('./data/legacy-urls.txt', 'utf8')
  .split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'))
for (const from of legacy) {
  if (written.has(from)) continue
  const to = successor(from)
  if (to !== from && written.has(to)) {
    write(from, redirectPage(from, to))
    redirects++
  } else {
    // Nothing matches any more — send it to the language index rather than
    // into a 404.
    const lang = from.startsWith('/de/') ? 'de' : 'en'
    write(from, redirectPage(from, `/${lang}/`))
    orphans++
  }
}
console.log(`Weiterleitungen: ${redirects} auf die neue URL, ${orphans} auf die Sprachstartseite`)

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
  .filter(p => !p.open && new Date(p.date) >= today)
  .sort((a, b) => a.date.localeCompare(b.date))
const homeJsonld = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: `Pride Map ${YEAR}`,
      url: `${ORIGIN}/`,
      description: `Interactive map and calendar of 600+ LGBTQ+ Pride parades across Europe in ${YEAR}.`,
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

// Every page points at /og/<slug>.jpg for its hero and its preview. When the
// slugs changed, the cache still held the old names and every page would have
// shipped a broken image — with nothing failing. So: check.
const missingImages = [...slugs.values()]
  .filter(slug => !fs.existsSync(path.join(DIST, 'og', `${slug}.jpg`)))
if (missingImages.length) {
  console.warn(`Share images: ${missingImages.length} von ${slugs.size} fehlen` +
    ` — ${missingImages.slice(0, 3).join(', ')}${missingImages.length > 3 ? ' …' : ''}` +
    `  (pnpm run og)`)
}

const pageCount = urls.length * LANGS.length
console.log(`Prerender: ${parades.length} events × ${LANGS.length} langs, ${countries.length} country hubs, ${months.length} month hubs`)
console.log(`Share images: ${imageCount} copied to dist/og/`)
console.log(`Sitemap: ${pageCount + 1} URLs with hreflang, lastmod ${lastmod}`)
console.log(`JSON-LD: ${upcoming.length} upcoming events on the homepage`)
