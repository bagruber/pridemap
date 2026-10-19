// Vite-free so the build scripts can import it under plain Node (timeColors.js
// reads import.meta.env and cannot be).

// Whole calendar days between two dates, DST included: Math.round survives the
// 23- and 25-hour days that the clock changes produce.
export function daysUntil(dateStr, from = new Date()) {
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const today = new Date(from)
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / 86400000)
}
