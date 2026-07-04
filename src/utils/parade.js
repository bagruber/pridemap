import { colorForDays } from './timeColors.js'

// A Pride is "first-time" when its recorded first year equals the year it runs,
// i.e. 2026 events with firstYear === 2026 are debuting this year.
export function isFirstTime(p) {
  return p.firstYear != null && Number(String(p.date).slice(0, 4)) === p.firstYear
}

export function toSelection(p) {
  return {
    id: p.id,
    name: p.name,
    city: p.city,
    country: p.country,
    lat: p.lat ?? null,
    lon: p.lon ?? null,
    date: p.date,
    size: p.size,
    daysUntil: p.daysUntil,
    color: p.color ?? colorForDays(p.daysUntil),
    queerIndex: p.queerIndex,
    website: p.website ?? null,
    instagram: p.instagram ?? null,
    firstYear: p.firstYear ?? null,
  }
}
