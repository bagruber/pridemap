import { colorForDays } from './timeColors.js'

// Lives in its own Vite-free module so build scripts can import it under Node
export { isFirstTime } from './firstTime.js'

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
