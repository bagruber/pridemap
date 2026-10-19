import { flag } from '../utils/countryInfo.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t, tf, cityName, labelForDaysLong, formatDate } from '../utils/i18n.js'

export default function Tooltip({ x, y, name, city, cityDe, cityEn, country, date, daysUntil, open, lastDate, color }) {
  const { lang } = useLang()
  const isPast = daysUntil < 0
  const displayCity = cityName({ city, cityDe, cityEn }, lang)

  const formatted = open
    ? (lastDate
        ? tf('lastHeld', lang, {
            year: lastDate.slice(0, 4),
            date: formatDate(lastDate, lang, { day: 'numeric', month: 'short' }),
          })
        : t('dateOpen', lang))
    : formatDate(date, lang, { day: 'numeric', month: 'short', year: 'numeric' })

  const daysText = open ? t('dateOpen', lang)
    : isPast ? `${Math.abs(daysUntil)} ${t('daysAgo', lang)}`
    : daysUntil === 0 ? t('today', lang)
    : daysUntil === 1 ? t('tomorrow', lang)
    : `in ${labelForDaysLong(daysUntil, lang, { dative: true })}`

  const style = {
    left: x + 14,
    top: y - 10,
  }

  if (typeof window !== 'undefined' && x > window.innerWidth - 250) {
    style.left = x - 230
  }

  return (
    <div className="map-tooltip" style={style}>
      <div className="tooltip-name">{name}</div>
      <div className="tooltip-date"><span className={flag(country)} /> {displayCity} · {formatted}</div>
      <div className="tooltip-days" style={{ color: isPast ? '#555' : color }}>
        {daysText}
      </div>
    </div>
  )
}
