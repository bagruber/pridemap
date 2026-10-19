// The filter pass behind map and list. Pure, so a test can pin it to a date
// instead of waiting for a Saturday.
//
// `today` is a local midnight (see startOfToday in App.jsx); `parades` carry a
// precomputed `daysUntil`.
// Calendar days, not 24-hour blocks: on the night the clocks go back, adding
// 86400000 ms lands at 23:00 the day before and shunts a whole weekend out of
// range.
const addDays = (d, n) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function filterParades(parades, filters, today) {
  const dow = today.getDay()
  let weekendSat
  if (dow === 6) weekendSat = today
  else if (dow === 0) weekendSat = addDays(today, -1)
  else weekendSat = addDays(today, 6 - dow)
  const weekendSun = addDays(weekendSat, 1)
  const nextWeekendSat = addDays(weekendSat, 7)
  const nextWeekendSun = addDays(weekendSun, 7)

  return parades.filter(p => {
    if (filters.countries.length > 0 && !filters.countries.includes(p.country)) return false
    if (filters.sizes.length > 0 && !filters.sizes.includes(p.size)) return false
    if (filters.months.length > 0 && !filters.months.includes(Number(p.date.slice(5, 7)))) return false
    if (filters.timeframe === 'upcoming' && p.daysUntil < 0) return false
    if (filters.timeframe === 'past' && p.daysUntil >= 0) return false
    if (filters.timeframe === 'weekend') {
      const d = new Date(p.date); d.setHours(0, 0, 0, 0)
      if (d < weekendSat || d > weekendSun) return false
    }
    if (filters.timeframe === 'next-weekend') {
      const d = new Date(p.date); d.setHours(0, 0, 0, 0)
      if (d < nextWeekendSat || d > nextWeekendSun) return false
    }
    return true
  }).sort((a, b) => a.city.localeCompare(b.city))
}
