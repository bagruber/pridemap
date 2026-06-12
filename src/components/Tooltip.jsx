import { flag } from '../utils/countryInfo.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t, cityName, labelForDaysLong, formatDate } from '../utils/i18n.js'

export default function Tooltip({ x, y, name, city, country, date, daysUntil, color }) {
  const { lang } = useLang()
  const formatted = formatDate(date, lang, {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const isPast = daysUntil < 0
  const displayCity = cityName(city, lang)

  const daysText = isPast
    ? `${Math.abs(daysUntil)} ${t('daysAgo', lang)}`
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
