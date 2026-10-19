import { slugify } from './slug.js'

// RFC 5545: commas, semicolons and backslashes must be escaped in text values
function icsEscape(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** One all-day event for the edition on show. Nothing to download without a date. */
export function downloadICS(p) {
  if (!p.date) return
  const pad = n => String(n).padStart(2, '0')
  const [yr, mo, da] = p.date.split('-').map(Number)
  const start = `${yr}${pad(mo)}${pad(da)}`
  const endDate = new Date(yr, mo - 1, da + 1)
  const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}`
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//pridemap//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${p.id}-${yr}@pridemap.net`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEscape(p.name)}`,
    `LOCATION:${icsEscape(p.city)}`,
    p.website ? `URL:${p.website}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([lines], { type: 'text/calendar;charset=utf-8' })),
    download: `${slugify(p.name || p.city)}-${yr}.ics`,
  })
  a.click()
  URL.revokeObjectURL(a.href)
}
