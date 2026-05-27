import { labelForDays } from '../utils/timeColors.js'

export default function Tooltip({ x, y, name, city, country, date, daysUntil, color }) {
  const formatted = new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const daysLabel = labelForDays(daysUntil)
  const isPast = daysUntil < 0

  const style = {
    left: x + 14,
    top: y - 10,
  }

  // Nudge left if near right edge
  if (typeof window !== 'undefined' && x > window.innerWidth - 250) {
    style.left = x - 230
  }

  return (
    <div className="map-tooltip" style={style}>
      <div className="tooltip-name">{name}</div>
      <div className="tooltip-date">{city}, {country} · {formatted}</div>
      <div className="tooltip-days" style={{ color: isPast ? '#555' : color }}>
        {isPast ? daysLabel : `in ${daysLabel}`}
      </div>
    </div>
  )
}
