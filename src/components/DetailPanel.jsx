import { labelForDays, indexColor, indexLabel } from '../utils/timeColors.js'
import attendanceData from '../data/attendance.json'

const attendanceLookup = Object.fromEntries(attendanceData.map(a => [a.city, a]))

const COUNTRY_NAMES = {
  AL:'Albania', AD:'Andorra', AT:'Austria', BE:'Belgium', BA:'Bosnia & Herz.',
  BG:'Bulgaria', HR:'Croatia', CY:'Cyprus', CZ:'Czechia', DK:'Denmark',
  EE:'Estonia', FI:'Finland', FR:'France', DE:'Germany', GR:'Greece',
  HU:'Hungary', IS:'Iceland', IE:'Ireland', IT:'Italy', XK:'Kosovo',
  LV:'Latvia', LI:'Liechtenstein', LT:'Lithuania', LU:'Luxembourg',
  MT:'Malta', MD:'Moldova', MC:'Monaco', ME:'Montenegro', NL:'Netherlands',
  MK:'North Macedonia', NO:'Norway', PL:'Poland', PT:'Portugal', RO:'Romania',
  RU:'Russia', SM:'San Marino', RS:'Serbia', SK:'Slovakia', SI:'Slovenia',
  ES:'Spain', SE:'Sweden', CH:'Switzerland', TR:'Turkey', UA:'Ukraine',
  GB:'United Kingdom', GE:'Georgia', AM:'Armenia', AZ:'Azerbaijan', BY:'Belarus',
}

function formatBucket(n) {
  if (n >= 1000000) return `≥${(n / 1000000).toLocaleString('en')}M`
  if (n >= 1000) return `≥${(n / 1000).toLocaleString('en')}k`
  return `≥${n.toLocaleString('en')}`
}

export default function DetailPanel({ parade, onClose }) {
  const { name, city, country, date, size, daysUntil, color, queerIndex, website, firstYear } = parade
  const isPast = daysUntil < 0

  const formatted = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const countdownText = isPast
    ? `${Math.abs(daysUntil)} days ago`
    : daysUntil === 0 ? 'Today!'
    : daysUntil === 1 ? 'Tomorrow!'
    : `${labelForDays(daysUntil)} away`

  const sizeLabel = { small: 'Small', medium: 'Medium', large: 'Large' }[size] ?? size
  const countryName = COUNTRY_NAMES[country] ?? country

  const att = attendanceLookup[city]

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          <div className="detail-city-name">{city}</div>
          <div className="detail-title">{name}</div>
        </div>
        <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className={`detail-countdown ${isPast ? 'past' : ''}`} style={{ color: isPast ? undefined : color }}>
        {countdownText}
      </div>
      <div className="detail-date">{formatted}</div>

      <div className="detail-meta">
        <div className="detail-chip">
          <div className="chip-dot" style={{ background: color }} />
          {countryName}
        </div>
        <div className="detail-chip">· {sizeLabel} event</div>
        {firstYear && (
          <div className="detail-chip">
            · Est. {firstYear}
          </div>
        )}
      </div>

      {att && (
        <div className="detail-attendance">
          <div className="detail-stat-label">Attendance</div>
          <div className="detail-stat-value">
            {formatBucket(att.bucket)}
            <span className="detail-stat-sub"> visitors ({att.year}{att.note ? ` · ${att.note}` : ''})</span>
          </div>
        </div>
      )}

      {queerIndex != null && (
        <div className="detail-index">
          <div className="index-label">
            <span>ILGA Rainbow Index</span>
            <span style={{ color: indexColor(queerIndex) }}>
              {queerIndex}% · {indexLabel(queerIndex)}
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

      {website && (
        <div className="detail-website">
          <a href={website} target="_blank" rel="noopener noreferrer">
            {website.replace(/^https?:\/\//, '')}
          </a>
        </div>
      )}
    </div>
  )
}
