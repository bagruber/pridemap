// Shared vocabulary for the build-time prerenderer: slugs, URLs and the
// localized strings the static pages need. Kept free of any Vite-only imports.
import { COUNTRY_NAMES } from '../../src/utils/countryInfo.js'
import { isFirstTime } from '../../src/utils/firstTime.js'
import { localPride, displayAka } from '../../src/utils/prideTerms.js'
import { slugify } from '../../src/utils/slug.js'
import { season } from '../../src/utils/season.js'

export { COUNTRY_NAMES, isFirstTime, localPride, displayAka, slugify }

// "a, b oder c" — the last separator is the only part that differs
export const joinOr = (lang, arr) => arr.length < 2
  ? (arr[0] ?? '')
  : `${arr.slice(0, -1).join(', ')} ${lang === 'de' ? 'oder' : 'or'} ${arr[arr.length - 1]}`

export const ORIGIN = 'https://pridemap.net'
export const LANGS = ['de', 'en']
// The season the static pages are about. An October build is what turns the
// site over to the next year.
export const YEAR = season()

// ── Design tokens ────────────────────────────────────────────────────────────
// Single source for everything rendered outside the app (static pages, share
// images). Values mirror :root in src/styles/main.css — keep them in step.
// `dim` is deliberately absent: it failed WCAG AA as text, and the static
// pages only ever used it for text.
export const TOKENS = {
  bg: '#0e0e0e',
  surface: '#171717',
  surface2: '#1f1f1f',
  border: '#2a2a2a',
  text: '#e8e8e8',
  muted: '#888888',
  // Non-text UI only (hover borders) — clears 3:1, not 4.5:1
  dimUi: '#6e6e6e',
  accent: '#ff2d78',
  premiere: '#ffd447',
}

export const PRIDE_STOPS = ['#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787']
export const PRIDE_GRADIENT = `linear-gradient(90deg, ${PRIDE_STOPS.join(', ')})`

// ── Slugs ────────────────────────────────────────────────────────────────────
// slugify lives in src/utils so the app can build the same ICS file names.

// A permanent slug per Pride: the name carries no year any more, so the URL
// does not either. Collisions fall back to the city and then to the id, which
// is unique by construction.
export function buildSlugMap(prides) {
  const taken = new Set()
  const out = new Map()
  for (const p of prides) {
    const base = slugify(p.name) || slugify(`${p.city} pride`) || slugify(p.id)
    let slug = base
    if (taken.has(slug)) slug = `${base}-${slugify(p.city)}`
    if (taken.has(slug)) slug = slugify(p.id)
    taken.add(slug)
    out.set(p.id, slug)
  }
  return out
}

// ── URLs ─────────────────────────────────────────────────────────────────────
export const eventPath   = (lang, slug) => `/${lang}/${slug}/`
export const eventUrl    = (lang, slug) => `${ORIGIN}${eventPath(lang, slug)}`
export const absolute    = p => `${ORIGIN}${p}`
// Deep link back into the SPA
export const appLink     = id => `${ORIGIN}/#selected=${encodeURIComponent(id)}`
// JPEG: a 1200×630 map render is ~60 kB as JPEG vs ~230 kB as PNG, and this
// doubles as the hero image on every event page.
export const ogImagePath = slug => `/og/${slug}.jpg`

// Hub slugs are localized — that's where the search keywords live
// No year in the path: a hub is about the country, not about one season. The
// season lives in the title, the h1 and the description, where it can change
// without breaking a link.
export function countryHubSlug(lang, code) {
  const en = COUNTRY_NAMES[code] ?? code
  const de = COUNTRY_NAMES_DE[code] ?? en
  return lang === 'de'
    ? `csd-pride-${slugify(de)}`
    : `pride-${slugify(en)}`
}

export function monthHubSlug(lang, month) {
  const name = slugify(MONTHS[lang][month - 1])
  return lang === 'de' ? `csd-termine-${name}` : `pride-${name}`
}

export const hubPath = (lang, slug) => `/${lang}/${slug}/`

// ── Localized vocabulary ─────────────────────────────────────────────────────
export const MONTHS = {
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
       'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June',
       'July', 'August', 'September', 'October', 'November', 'December'],
}

export const WEEKDAYS = {
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}

// German country names — the English ones come from countryInfo.js
export const COUNTRY_NAMES_DE = {
  AL: 'Albanien', AD: 'Andorra', AT: 'Österreich', BE: 'Belgien', BA: 'Bosnien & Herz.',
  BG: 'Bulgarien', HR: 'Kroatien', CY: 'Zypern', CZ: 'Tschechien', DK: 'Dänemark',
  EE: 'Estland', FI: 'Finnland', FR: 'Frankreich', DE: 'Deutschland', GR: 'Griechenland',
  HU: 'Ungarn', IS: 'Island', IE: 'Irland', IT: 'Italien', XK: 'Kosovo',
  LV: 'Lettland', LI: 'Liechtenstein', LT: 'Litauen', LU: 'Luxemburg',
  MT: 'Malta', MD: 'Moldau', MC: 'Monaco', ME: 'Montenegro', NL: 'Niederlande',
  MK: 'Nordmazedonien', NO: 'Norwegen', PL: 'Polen', PT: 'Portugal', RO: 'Rumänien',
  RU: 'Russland', SM: 'San Marino', RS: 'Serbien', SK: 'Slowakei', SI: 'Slowenien',
  ES: 'Spanien', SE: 'Schweden', CH: 'Schweiz', TR: 'Türkei', UA: 'Ukraine',
  GB: 'Vereinigtes Königreich', GE: 'Georgien', AM: 'Armenien', AZ: 'Aserbaidschan',
  BY: 'Belarus', GG: 'Guernsey',
}

export const countryName = (lang, code) =>
  (lang === 'de' ? COUNTRY_NAMES_DE[code] : COUNTRY_NAMES[code]) ?? COUNTRY_NAMES[code] ?? code

// Takes a Pride record: the city under its own name, German or English
// where they differ.
export const cityName = (lang, p) => p?.cityNames?.[lang] ?? p?.city ?? ''

// Date-only formatting, timezone-proof (no Date parsing of the ISO string)
export function formatDate(lang, dateStr, { weekday = true } = {}) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const wd = WEEKDAYS[lang][new Date(y, m - 1, d).getDay()]
  const month = MONTHS[lang][m - 1]
  const core = lang === 'de' ? `${d}. ${month} ${y}` : `${d} ${month} ${y}`
  return weekday ? `${wd}, ${core}` : core
}

export const SIZE_LABEL = {
  de: { small: 'Kleines Event', medium: 'Mittelgroßes Event', large: 'Großes Event' },
  en: { small: 'Small event', medium: 'Medium event', large: 'Large event' },
}

export const T = {
  de: {
    siteName: `Pride Map ${YEAR}`,
    tagline: `Alle Pride-Paraden & CSD-Termine in Europa ${YEAR}`,
    dateLabel: 'Datum',
    whereLabel: 'Ort',
    sizeLabel: 'Größe',
    attendanceLabel: 'Besucherzahl',
    firstEdition: 'Premiere',
    firstEditionNote: `Findet ${YEAR} zum ersten Mal statt`,
    rescheduled: 'Verlegt',
    alsoCalled: (terms, country) => `In ${country} heißt eine Pride auch ${terms}.`,
    movedFrom: d => `Verlegt vom ${d}`,
    officialSite: 'Offizielle Website',
    instagram: 'Instagram',
    openOnMap: 'Auf der Karte öffnen',
    backToMap: 'Zur Pride Map',
    ilga: 'ILGA Rainbow Index',
    moreIn: code => `Weitere Prides in ${code}`,
    sameMonth: m => `Weitere CSD-Termine im ${m} ${YEAR}`,
    allEvents: 'Alle Termine auf der Karte',
    eventsIn: n => `${n} Termine`,
    disclaimer: 'Jeder Termin nennt seine Quelle und das Datum der letzten Prüfung. Stimmt etwas nicht, hilft „Fehler melden“ direkt am Pride.',
    aboutMap: `Pride Map ${YEAR} ist eine interaktive Karte aller Pride-Paraden und CSD-Termine in Europa — filterbar nach Land, Monat und Größe.`,
    dateOpen: y => `Termin ${y} noch nicht bekannt`,
    dateOpenShort: 'offen',
    lastHeld: (y, d) => `${y} war am ${d}`,
    earlierEditions: 'Frühere Ausgaben',
    openSection: 'Termin noch offen',
    visitorsSuffix: 'Besucher',
    sourceAuthorities: 'laut Behörden',
    sourceOrganizers: 'laut Veranstaltern',
  },
  en: {
    siteName: `Pride Map ${YEAR}`,
    tagline: `Every Pride parade across Europe in ${YEAR}`,
    dateLabel: 'Date',
    whereLabel: 'Location',
    sizeLabel: 'Size',
    attendanceLabel: 'Attendance',
    firstEdition: 'First edition',
    firstEditionNote: `Happening for the first time in ${YEAR}`,
    rescheduled: 'Rescheduled',
    alsoCalled: (terms, country) => `In ${country}, a Pride is also called ${terms}.`,
    movedFrom: d => `Moved from ${d}`,
    officialSite: 'Official website',
    instagram: 'Instagram',
    openOnMap: 'Open on the map',
    backToMap: 'To the Pride Map',
    ilga: 'ILGA Rainbow Index',
    moreIn: code => `More Prides in ${code}`,
    sameMonth: m => `More Pride dates in ${m} ${YEAR}`,
    allEvents: 'All dates on the map',
    eventsIn: n => `${n} dates`,
    disclaimer: 'Every date names its source and when it was last checked. If something is wrong, use “Report an error” on the Pride itself.',
    aboutMap: `Pride Map ${YEAR} is an interactive map of every Pride parade across Europe — filterable by country, month and size.`,
    dateOpen: y => `No ${y} date yet`,
    dateOpenShort: 'open',
    lastHeld: (y, d) => `${y} was on ${d}`,
    earlierEditions: 'Earlier editions',
    openSection: 'Date still open',
    visitorsSuffix: 'visitors',
    sourceAuthorities: 'according to authorities',
    sourceOrganizers: 'according to organizers',
  },
}

export const escapeHtml = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
