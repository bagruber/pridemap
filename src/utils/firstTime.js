// Kept free of Vite-specific globals (import.meta.env) so the build-time
// prerender scripts can import it directly under plain Node.

// A Pride is "first-time" when its recorded first year equals the year it runs,
// i.e. 2026 events with firstYear === 2026 are debuting this year.
export function isFirstTime(p) {
  return p.firstYear != null && Number(String(p.date).slice(0, 4)) === p.firstYear
}
