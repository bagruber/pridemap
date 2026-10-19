// gayprideshop.co.uk keeps the UK & Ireland calendar, one page per year: a
// table per month, each row a link to the organiser and a free-text date. The
// same rows repeat further down in alphabetical order.
import { textOf, cleanUrl } from '../html.mjs'

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

/**
 * The page's free-text dates: "25 April 2026", "13-14 February 2026",
 * "31 July- 1 Aug 2026", "TBC", "Cancelled", "No 2026 Event".
 * Returns { date, endDate, status }; status is 'cancelled' for the last two.
 */
export function parseEnglishDate(text, year) {
  const t = textOf(text).toLowerCase()
  if (/cancel/.test(t) || /^no\b/.test(t)) return { date: null, endDate: null, status: 'cancelled' }
  const y = Number(t.match(/\b(20\d\d)\b/)?.[1] ?? year)
  const days = [...t.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?\b/g)].map(m => Number(m[1])).filter(d => d >= 1 && d <= 31)
  const months = [...t.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/g)].map(m => MONTHS[m[1]])
  if (!days.length || !months.length || !y) return { date: null, endDate: null, status: null }
  return {
    date: iso(y, months[0], days[0]),
    endDate: days.length > 1 ? iso(y, months[months.length - 1], days[days.length - 1]) : null,
    status: null,
  }
}

export function parseGayPrideShop(html, { year } = {}) {
  const byName = new Map()
  for (const row of String(html).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => c[1])
    if (cells.length !== 2) continue
    const name = textOf(cells[0])
    if (!name) continue
    const { date, endDate, status } = parseEnglishDate(cells[1], year)
    const entry = {
      name,
      date,
      endDate,
      place: null,
      // UK, Ireland and the Crown Dependencies share the page; the matcher
      // looks in all of them
      country: null,
      countryLabel: null,
      url: cleanUrl(cells[0].match(/href="([^"]+)"/)?.[1]),
      status,
    }
    // The alphabetical list repeats rows, sometimes as "TBC", sometimes without
    // the year ("Angus Pride" for "Angus Pride 2026"). Keep the dated one.
    const key = name.replace(/\b20\d\d\b/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
    const prev = byName.get(key)
    if (!prev || (!prev.date && entry.date)) byName.set(key, entry)
  }
  return [...byName.values()]
}
