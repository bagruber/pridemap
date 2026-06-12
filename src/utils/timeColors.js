export const TIME_BUCKETS = [
  { label: 'This week',    max: 7,   color: '#FF2D78' },
  { label: '1–2 weeks',   max: 14,  color: '#FF6B2B' },
  { label: '2–3 weeks',   max: 21,  color: '#FF9500' },
  { label: '3–4 weeks',   max: 28,  color: '#FFD700' },
  { label: '4–6 weeks',   max: 42,  color: '#34C759' },
  { label: '6–8 weeks',   max: 56,  color: '#00C7BE' },
  { label: '1–3 months',  max: 91,  color: '#0A84FF' },
  { label: '3–6 months',  max: 182, color: '#5856D6' },
  { label: '>6 months',   max: Infinity, color: '#7C3AED' },
]

export const PAST_COLOR = import.meta.env.VITE_COLORFUL_PAST === 'true' ? '#7C3AED' : '#3a3a3a'

export function daysUntil(dateStr, from = new Date()) {
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const today = new Date(from)
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / 86400000)
}

export function colorForDays(days) {
  if (days < 0) return PAST_COLOR
  for (const b of TIME_BUCKETS) {
    if (days <= b.max) return b.color
  }
  return TIME_BUCKETS[TIME_BUCKETS.length - 1].color
}

export function indexColor(score) {
  if (score >= 70) return '#34C759'
  if (score >= 50) return '#FFD700'
  if (score >= 30) return '#FF9500'
  return '#FF2D78'
}

export function indexLabel(score) {
  if (score >= 70) return 'Friendly'
  if (score >= 50) return 'Moderate'
  if (score >= 30) return 'Restrictive'
  return 'Hostile'
}
