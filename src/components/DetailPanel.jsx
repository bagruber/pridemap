import { FaInstagram, FaGlobe } from 'react-icons/fa'
import { Info, X } from 'lucide-react'
import { indexColor } from '../utils/timeColors.js'
import { COUNTRY_NAMES, flag } from '../utils/countryInfo.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t, cityName, indexLabelL10n, labelForDaysLong, formatDate } from '../utils/i18n.js'
import attendanceData from '../data/attendance.json'

const attendanceLookup = Object.fromEntries(attendanceData.map(a => [a.city, a]))

function formatBucket(n) {
  if (n >= 1000000) return `≥${(n / 1000000).toLocaleString('en')}M`
  if (n >= 1000) return `≥${(n / 1000).toLocaleString('en')}k`
  return `≥${n.toLocaleString('en')}`
}

// RFC 5545: commas, semicolons and backslashes must be escaped in text values
function icsEscape(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function downloadICS(parade) {
  const pad = n => String(n).padStart(2, '0')
  const [yr, mo, da] = parade.date.split('-').map(Number)
  const start = `${yr}${pad(mo)}${pad(da)}`
  const endDate = new Date(yr, mo - 1, da + 1)
  const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}`
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PrideMap 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${parade.id}@pridemap.net`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEscape(parade.name)}`,
    `LOCATION:${icsEscape(parade.city)}`,
    parade.website ? `URL:${parade.website}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([lines], { type: 'text/calendar;charset=utf-8' })),
    download: `${parade.city.toLowerCase().replace(/\s+/g, '-')}-pride-2026.ics`,
  })
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function DetailPanel({ parade, onClose }) {
  const { lang } = useLang()
  const { name, city, country, date, size, daysUntil, color, queerIndex, website, instagram, firstYear } = parade
  const isPast = daysUntil < 0

  const formatted = formatDate(date, lang, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const countdownText = isPast
    ? `${Math.abs(daysUntil)} ${t('daysAgo', lang)}`
    : daysUntil === 0 ? t('today', lang)
    : daysUntil === 1 ? t('tomorrow', lang)
    : lang === 'de'
      ? `noch ${labelForDaysLong(daysUntil, 'de')}`
      : `${labelForDaysLong(daysUntil, 'en')} ${t('away', lang)}`

  const sizeEventKey = { small: 'smallEvent', medium: 'mediumEvent', large: 'largeEvent' }[size]
  const sizeLabel = sizeEventKey ? t(sizeEventKey, lang) : size
  const countryName = COUNTRY_NAMES[country] ?? country
  const displayCity = cityName(city, lang)
  const att = attendanceLookup[city]

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          <div className="detail-city-name" style={{ color }}>{displayCity}</div>
          <div className="detail-title">{name}</div>
        </div>
        <button className="detail-close" onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>
      </div>

      <div className={`detail-countdown ${isPast ? 'past' : ''}`} style={{ color: isPast ? undefined : color }}>
        {countdownText}
      </div>
      <div className="detail-date">{formatted}</div>
      {!isPast && (
        <button className="cal-btn" onClick={() => downloadICS(parade)}>{t('addToCalendar', lang)}</button>
      )}

      <div className="detail-meta">
        <div className="detail-chip">
          <span className={`${flag(country)} chip-flag`} />
          {countryName}
        </div>
        <div className="detail-chip" title={t('sizeNote', lang)}>
          · {sizeLabel}
          <Info size={11} className="detail-chip-info" aria-hidden="true" />
        </div>
        {firstYear && (
          <div className="detail-chip">· {t('established', lang)} {firstYear}</div>
        )}
      </div>

      {att && (
        <div className="detail-attendance">
          <div className="detail-stat-label">{t('attendance', lang)}</div>
          <div className="detail-stat-value">
            {formatBucket(att.bucket)} {t('visitors', lang)}
            <span className="detail-stat-sub">
              {' '}({att.year ?? '?'})
              {att.source === 'authorities' && ` · ${t('sourceAuthorities', lang)}`}
              {att.source === 'organizers' && ` · ${t('sourceOrganizers', lang)}`}
            </span>
          </div>
        </div>
      )}

      {queerIndex != null && (
        <div className="detail-index">
          <div className="index-label">
            <span>{t('ilgaIndex', lang)}</span>
            <span style={{ color: indexColor(queerIndex) }}>
              {queerIndex}% · {indexLabelL10n(queerIndex, lang)}
            </span>
          </div>
          <div className="index-bar-track">
            <div
              className="index-bar-fill"
              style={{ width: `${queerIndex}%`, background: indexColor(queerIndex) }}
            />
          </div>
        </div>
      )}

      {(website || instagram) && (
        <div className="detail-links">
          {website && (
            <a
              className="detail-link-btn"
              href={website}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGlobe size={12} />
              <span>{website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
            </a>
          )}
          {instagram && (
            <a
              className="detail-link-btn detail-link-ig"
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram size={13} />
              <span>{'@' + instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')}</span>
            </a>
          )}
        </div>
      )}
    </div>
  )
}
