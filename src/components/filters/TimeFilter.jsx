import { TIMEFRAMES, WEEKENDS } from '../../utils/filterConstants.js'
import { useLang } from '../../contexts/LangContext.jsx'
import { t } from '../../utils/i18n.js'

// One group, not two. "Kommende / Alle / Dieses WE" used to sit in the sheet's
// peek and "Vergangene / Nächstes WE" inside it — the same question answered
// in two places, which made it look like two questions.
const ORDER = [
  TIMEFRAMES[0],              // upcoming
  WEEKENDS[0],                // this weekend
  WEEKENDS[1],                // next weekend
  TIMEFRAMES[1],              // all
  TIMEFRAMES[2],              // past
]

export default function TimeFilter({ filters, onChange }) {
  const { lang } = useLang()
  return (
    <div className="option-pills">
      {ORDER.map(o => (
        <button
          key={o.value}
          type="button"
          className={`option-pill ${filters.timeframe === o.value ? 'is-on' : ''}`}
          aria-pressed={filters.timeframe === o.value}
          onClick={() => onChange({ ...filters, timeframe: o.value })}
        >
          {t(o.key, lang)}
        </button>
      ))}
    </div>
  )
}
