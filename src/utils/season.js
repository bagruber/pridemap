// Vite-free so the build scripts can import it under plain Node.

/**
 * The season a day belongs to. From 1 October the map is about next year:
 * that is when the first dates for it appear and when this year's are only
 * of historical interest.
 *
 * Everything that used to say "2026" asks this instead, so the turn of the
 * year is a matter of data, not of code.
 */
export function season(today = new Date()) {
  return today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear()
}
