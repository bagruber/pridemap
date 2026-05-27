import { labelForDays } from '../utils/timeColors.js'
import { flag } from '../utils/countryInfo.js'
import { useLang } from '../contexts/LangContext.jsx'
import { cityName } from '../utils/i18n.js'

export default function Tooltip({ x, y, name, city, country, date, daysUntil, color }) {
  const { lang } = useLang()
  const locale = lang === 'de' ? 'de-DE' : 'en-GB'
  const formatted = new Date(date).toLocaleDateString(locale, {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const daysLabel = labelForDays(daysUntil)
  const isPast = daysUntil < 0
  const displayCity = cityName(city, lang)

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
        {isPast ? daysLabel : `in ${daysLabel}`}
      </div>
    </div>
  )
}
