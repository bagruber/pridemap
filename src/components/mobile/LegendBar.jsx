import { TIME_BUCKETS, PAST_COLOR, OPEN_COLOR } from '../../utils/timeColors.js'
import { useLang } from '../../contexts/LangContext.jsx'
import { t } from '../../utils/i18n.js'

// The colour scale as one bar instead of a list of dots: it is a scale, and a
// bar says so. "Past" sits apart on the left, separated by a gap, because it
// is not a point on that scale but the other side of it.
export default function LegendBar() {
  const { lang } = useLang()
  return (
    <div className="legend-bar">
      <div className="legend-bar-strip">
        <span className="legend-seg legend-seg-past" style={{ background: PAST_COLOR }} />
        <span className="legend-seg-gap" />
        {TIME_BUCKETS.map(b => (
          <span key={b.label} className="legend-seg" style={{ background: b.color }} />
        ))}
      </div>
      <div className="legend-bar-labels">
        <span className="legend-bar-past">{t('legendPastShort', lang)}</span>
        <span>{t('legendSoon', lang)}</span>
        <span className="legend-bar-far">{t('legendFar', lang)}</span>
      </div>
      <div className="legend-bar-keys">
        <span className="legend-key">
          <span className="legend-key-dots">
            <i style={{ width: 7, height: 7 }} />
            <i style={{ width: 11, height: 11 }} />
            <i style={{ width: 17, height: 17 }} />
          </span>
          {t('legendEventSize', lang)}
        </span>
        <span className="legend-key">
          <span className="legend-key-ring" style={{ borderColor: OPEN_COLOR }} />
          {t('dateOpen', lang)}
        </span>
        <span className="legend-key">
          <span className="legend-key-ring legend-key-premiere" />
          {t('firstTime', lang)}
        </span>
      </div>
    </div>
  )
}
