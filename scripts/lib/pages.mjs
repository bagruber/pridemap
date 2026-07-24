// Shared vocabulary for the build-time prerenderer: slugs, URLs and the
// localized strings the static pages need. Kept free of any Vite-only imports.
import { COUNTRY_NAMES } from '../../src/utils/countryInfo.js'
import { CITY_NAMES } from '../../src/utils/i18n.js'
import { isFirstTime } from '../../src/utils/firstTime.js'

export { COUNTRY_NAMES, CITY_NAMES, isFirstTime }

export const ORIGIN = 'https://pridemap.net'
export const LANGS = ['de', 'en']
export const YEAR = 2026

// ── Slugs ────────────────────────────────────────────────────────────────────
const TRANSLIT = {
  ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss',
  å: 'a', ø: 'o', æ: 'ae', ð: 'd', þ: 'th',
  ł: 'l', đ: 'd', ħ: 'h', ı: 'i',
}

export function slugify(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[äöüßåøæðþłđħı]/g, m => TRANSLIT[m] ?? m)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Stable, unique slug per event. Prefers the event name; falls back to the
// city, and disambiguates collisions with the date.
export function buildSlugMap(parades) {
  const bySlug = new Map()
  const out = new Map()
  for (const p of parades) {
    const base = slugify(p.name || `${p.city} pride ${YEAR}`) || slugify(p.id)
    let slug = base
    if (bySlug.has(slug)) slug = `${base}-${p.date.slice(5)}`      // +MM-DD
    if (bySlug.has(slug)) slug = `${base}-${slugify(p.id)}`         // last resort
    bySlug.set(slug, p)
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
export function countryHubSlug(lang, code) {
  const en = COUNTRY_NAMES[code] ?? code
  const de = COUNTRY_NAMES_DE[code] ?? en
  return lang === 'de'
    ? `csd-pride-${slugify(de)}-${YEAR}`
    : `pride-${slugify(en)}-${YEAR}`
}

export function monthHubSlug(lang, month) {
  const name = slugify(MONTHS[lang][month - 1])
  return lang === 'de'
    ? `csd-termine-${name}-${YEAR}`
    : `pride-${name}-${YEAR}`
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

export const cityName = (lang, city) => CITY_NAMES[city]?.[lang] ?? city

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
    siteName: 'Pride Map 2026',
    tagline: 'Alle Pride-Paraden & CSD-Termine in Europa 2026',
    dateLabel: 'Datum',
    whereLabel: 'Ort',
    sizeLabel: 'Größe',
    attendanceLabel: 'Besucherzahl',
    firstEdition: 'Premiere',
    firstEditionNote: `Findet ${YEAR} zum ersten Mal statt`,
    officialSite: 'Offizielle Website',
    instagram: 'Instagram',
    openOnMap: 'Auf der Karte öffnen',
    backToMap: 'Zur Pride Map',
    ilga: 'ILGA Rainbow Index',
    moreIn: code => `Weitere Prides in ${code}`,
    sameMonth: m => `Weitere CSD-Termine im ${m} ${YEAR}`,
    allEvents: 'Alle Termine auf der Karte',
    eventsIn: n => `${n} Termine`,
    disclaimer: 'Angaben ohne Gewähr — Termine können sich ändern. Bitte prüfe vor der Anreise die offizielle Seite der Veranstaltenden.',
    aboutMap: 'Pride Map 2026 ist eine interaktive Karte aller Pride-Paraden und CSD-Termine in Europa — filterbar nach Land, Monat und Größe.',
    visitorsSuffix: 'Besucher',
    sourceAuthorities: 'laut Behörden',
    sourceOrganizers: 'laut Veranstaltern',
  },
  en: {
    siteName: 'Pride Map 2026',
    tagline: 'Every Pride parade across Europe in 2026',
    dateLabel: 'Date',
    whereLabel: 'Location',
    sizeLabel: 'Size',
    attendanceLabel: 'Attendance',
    firstEdition: 'First edition',
    firstEditionNote: `Happening for the first time in ${YEAR}`,
    officialSite: 'Official website',
    instagram: 'Instagram',
    openOnMap: 'Open on the map',
    backToMap: 'To the Pride Map',
    ilga: 'ILGA Rainbow Index',
    moreIn: code => `More Prides in ${code}`,
    sameMonth: m => `More Pride dates in ${m} ${YEAR}`,
    allEvents: 'All dates on the map',
    eventsIn: n => `${n} dates`,
    disclaimer: 'All information without guarantee — dates can change. Please check the organisers’ official page before travelling.',
    aboutMap: 'Pride Map 2026 is an interactive map of every Pride parade across Europe — filterable by country, month and size.',
    visitorsSuffix: 'visitors',
    sourceAuthorities: 'according to authorities',
    sourceOrganizers: 'according to organizers',
  },
}

export const escapeHtml = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
