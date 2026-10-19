import { FaInstagram, FaGlobe } from 'react-icons/fa'
import { CalendarClock, Info, MapPin, Sparkles, X } from 'lucide-react'
import { colorForDays, indexColor } from '../utils/timeColors.js'
import { COUNTRY_NAMES, flag } from '../utils/countryInfo.js'
import { isFirstTime } from '../utils/firstTime.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t, tf, cityName, indexLabelL10n, labelForDaysLong, formatDate } from '../utils/i18n.js'
import { slugify } from '../utils/slug.js'

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
    'PRODID:-//pridemap//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${parade.id}-${yr}@pridemap.net`,
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
    download: `${slugify(parade.name || parade.city)}-${yr}.ics`,
  })
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function DetailPanel({ parade, onClose, onShowOnMap }) {
  const { lang } = useLang()
  const { name, country, date, size, daysUntil, queerIndex, website, instagram,
    firstYear, movedFrom, open, lastDate, year, status, source } = parade
  const isPast = daysUntil < 0
  const color = colorForDays(daysUntil)

  // An open date shows last year's instead — never a guess at this year's.
  const formatted = open
    ? (lastDate
        ? tf('lastHeld', lang, {
            year: lastDate.slice(0, 4),
            date: formatDate(lastDate, lang, { weekday: 'short', day: 'numeric', month: 'long' }),
          })
        : '')
    : formatDate(date, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const countdownText = open
    ? tf('dateOpenYear', lang, { year })
    : isPast
      ? `${Math.abs(daysUntil)} ${t('daysAgo', lang)}`
      : daysUntil === 0 ? t('today', lang)
      : daysUntil === 1 ? t('tomorrow', lang)
      : lang === 'de'
        ? `noch ${labelForDaysLong(daysUntil, 'de')}`
        : `${labelForDaysLong(daysUntil, 'en')} ${t('away', lang)}`

  const sizeEventKey = { small: 'smallEvent', medium: 'mediumEvent', large: 'largeEvent' }[size]
  const sizeLabel = sizeEventKey ? t(sizeEventKey, lang) : size
  const countryName = COUNTRY_NAMES[country] ?? country
  const displayCity = cityName(parade, lang)
  // The newest number the Pride has, whichever year it is from
  const att = [...(parade.attendance ?? [])].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0]
  const firstTime = isFirstTime(parade)

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          {firstTime && (
            <div className="premiere-badge" title={tf('firstTimeNote', lang, { year })}>
              <Sparkles size={11} aria-hidden="true" />
              {t('firstTime', lang)}
            </div>
          )}
          {movedFrom && (
            <div className="moved-badge">
              <CalendarClock size={11} aria-hidden="true" />
              {t('rescheduled', lang)}
            </div>
          )}
          <h2 className="detail-city-name" style={{ color }}>{displayCity}</h2>
          <div className="detail-title">{name}</div>
        </div>
        <button className="detail-close" onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>
      </div>

      <div className={`detail-countdown ${isPast || open ? 'past' : ''}`} style={{ color: isPast || open ? undefined : color }}>
        {countdownText}
      </div>
      <div className="detail-date">{formatted}</div>
      {movedFrom && (
        <div className="detail-moved-from">
          {t('insteadOf', lang)} <s>{formatDate(movedFrom, lang, { day: 'numeric', month: 'long', year: 'numeric' })}</s>
        </div>
      )}
      <div className="detail-btn-row">
        {!isPast && !open && (
          <button className="cal-btn" onClick={() => downloadICS(parade)}>{t('addToCalendar', lang)}</button>
        )}
        {onShowOnMap && (
          <button className="cal-btn" onClick={onShowOnMap}>
            <MapPin size={11} />
            {t('viewOnMap', lang)}
          </button>
        )}
      </div>

      <div className="detail-meta">
        <div className="detail-chip">
          <span className={`${flag(country)} chip-flag`} />
          {countryName}
        </div>
        <div className="detail-chip" title={t('sizeNote', lang)}>
          · {sizeLabel}
          <Info size={11} className="detail-chip-info" aria-hidden="true" />
        </div>
        {firstYear && !firstTime && (
          <div className="detail-chip">· {t('established', lang)} {firstYear}</div>
        )}
      </div>

      {att && (
        <div className="detail-attendance">
          <div className="detail-stat-label">{t('attendance', lang)}</div>
          <div className="detail-stat-value">
            {formatBucket(att.count)} {t('visitors', lang)}
            <span className="detail-stat-sub">
              {' '}({att.year ?? '?'})
              {att.by === 'authorities' && ` · ${t('sourceAuthorities', lang)}`}
              {att.by === 'organizers' && ` · ${t('sourceOrganizers', lang)}`}
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
          <div
            className="index-bar-track"
            role="meter"
            aria-valuenow={queerIndex}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('ilgaIndex', lang)}
          >
            <div
              className="index-bar-fill"
              style={{ transform: `scaleX(${queerIndex / 100})`, background: indexColor(queerIndex) }}
            />
          </div>
        </div>
      )}

      {source?.url && (
        <div className="detail-source">
          {t('sourceLabel', lang)}:{' '}
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            {source.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
          </a>
          {source.checked && ` · ${tf('checkedOn', lang, { date: formatDate(source.checked, lang) })}`}
          {status === 'announced' && ` · ${t('notConfirmed', lang)}`}
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
