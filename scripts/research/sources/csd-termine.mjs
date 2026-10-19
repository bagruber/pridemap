// csd-termine.de: one card per upcoming event, grouped by month. /deutschland
// lists Germany, /europa the rest of Europe with the country after the town.
import { norm } from '../../../src/utils/text.js'
import { textOf, cleanUrl } from '../html.mjs'

const MONTHS = {
  januar: 1, februar: 2, marz: 3, april: 4, mai: 5, juni: 6,
  juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12,
}

const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

/** "7. November 2026" → "2026-11-07" */
export function parseGermanDate(s) {
  const m = norm(s).match(/(\d{1,2})\.\s*([a-z]+)\s+(\d{4})/)
  if (!m || !MONTHS[m[2]]) return null
  return iso(m[3], MONTHS[m[2]], m[1])
}

// The listing names the country in German ("Riga, Lettland"). The UK's
// nations appear on their own.
const EUROPE = ['AD', 'AL', 'AM', 'AT', 'AZ', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE',
  'ES', 'FI', 'FO', 'FR', 'GB', 'GE', 'GG', 'GI', 'GR', 'HR', 'HU', 'IE', 'IM', 'IS', 'IT', 'JE', 'LI',
  'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'RU', 'SE', 'SI',
  'SK', 'SM', 'TR', 'UA', 'XK']
const COUNTRY_BY_NAME = (() => {
  const names = new Intl.DisplayNames(['de'], { type: 'region' })
  const out = { england: 'GB', wales: 'GB', schottland: 'GB', nordirland: 'GB', kosovo: 'XK' }
  for (const code of EUROPE) {
    try { out[norm(names.of(code))] = code } catch { /* unknown to this ICU build */ }
  }
  return out
})()

export const countryFromGerman = name => COUNTRY_BY_NAME[norm(name).trim()] ?? null

/**
 * Every event card on the page. `country` is the default for cards that name
 * only the town, as on /deutschland.
 */
export function parseCsdTermine(html, { country = null } = {}) {
  const out = []
  const seen = new Set()
  for (const m of String(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const [, attrs, inner] = m
    if (!/\bgf-teaser\b/.test(attrs)) continue
    const name = textOf(inner.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1])
    const lines = inner.match(/<\/h3>\s*<div>([\s\S]*?)<\/div>\s*<div>([\s\S]*?)<\/div>/)
    if (!name || !lines) continue

    const date = parseGermanDate(textOf(lines[1]))
    const [place, land] = textOf(lines[2]).split(/,\s*/)
    const href = cleanUrl(attrs.match(/href="([^"]+)"/)?.[1])
    // The same card can appear twice, in a highlights row and in its month
    const key = `${href ?? name}|${date}`
    if (seen.has(key)) continue
    seen.add(key)

    out.push({
      name,
      date,
      place: place || null,
      country: land ? countryFromGerman(land) : country,
      countryLabel: land ?? null,
      url: href,
      status: null,
    })
  }
  return out
}
