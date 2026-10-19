// Kept free of Vite-specific globals (import.meta.env) so the build-time
// prerender scripts can import it directly under plain Node.

// A Pride is "first-time" when the edition on show is its first one.
export function isFirstTime(p) {
  return p.firstYear != null && p.year === p.firstYear
}
