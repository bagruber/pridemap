import { norm } from './text.js'
import { parsePrideQuery } from './prideTerms.js'
import { COUNTRY_NAMES } from './countryInfo.js'
import { cityName } from './i18n.js'

/**
 * Ranked free-text search over the Prides — one implementation for the map's
 * search box and the list, so "pride berlin", "csd berlin" and "berlin" reach
 * the same row in both.
 *
 * Tiers: city prefix > city substring > event name > region/country, so "ber"
 * surfaces Berlin before the Baden-Württemberg towns. Within a tier the
 * soonest date wins and past events sink.
 *
 * An empty query matches everything. A one-character query does too — whether
 * that is worth showing is the caller's call.
 */
export function searchParades(parades, query) {
  const q = norm((query ?? '').trim())
  if (!q) return [...parades]

  // Words that just mean "Pride" are lifted out before matching, so the
  // national term someone happens to use never costs them a hit
  const { tokens, countries } = parsePrideQuery(q)
  const scored = []
  for (const p of parades) {
    const cities = [p.city, cityName(p, 'en'), cityName(p, 'de'), ...(p.aka ?? [])].map(norm)
    const name = norm(p.name ?? '')
    let tier
    if (!tokens.length) {
      // Nothing but Pride vocabulary was typed — the country it points at is
      // the only signal left, and the sort below puts the soonest on top
      if (countries && !countries.includes(p.country)) continue
      tier = 0
    } else {
      const hay = [...cities, name, norm(p.region ?? ''), norm(COUNTRY_NAMES[p.country] ?? '')].join(' ')
      if (!tokens.every(tk => hay.includes(tk))) continue
      const head = tokens[0]
      if (cities.some(c => c.startsWith(head))) tier = 0
      else if (cities.some(c => c.includes(head))) tier = 1
      else if (name.includes(head)) tier = 2
      else tier = 3
    }
    scored.push([tier, p])
  }
  // Within a tier: dated before open, upcoming before past, soonest first
  const rank = p => (p.daysUntil == null ? 1 : p.daysUntil < 0 ? 2 : 0)
  scored.sort((a, b) =>
    a[0] - b[0] ||
    rank(a[1]) - rank(b[1]) ||
    (a[1].daysUntil ?? 0) - (b[1].daysUntil ?? 0))
  return scored.map(s => s[1])
}
