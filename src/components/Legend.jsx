import { TIME_BUCKETS, PAST_COLOR } from '../utils/timeColors.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t } from '../utils/i18n.js'

const BUCKET_KEYS = [
  'legendThisWeek', 'legend1to2w', 'legend2to3w', 'legend3to4w',
  'legend4to6w', 'legend6to8w', 'legend1to3m', 'legend3to6m', 'legendOver6m',
]

export default function Legend() {
  const { lang } = useLang()

  return (
    <div className="legend">
      <div className="legend-title">{t('legendDaysUntil', lang)}</div>
      {TIME_BUCKETS.map((b, i) => (
        <div key={b.label} className="legend-item">
          <div className="legend-dot" style={{ background: b.color }} />
          <span>{t(BUCKET_KEYS[i], lang)}</span>
        </div>
      ))}
      <div className="legend-item">
        <div className="legend-dot" style={{ background: PAST_COLOR }} />
        <span>{t('legendPast', lang)}</span>
      </div>

      <hr className="legend-divider" />
      <div className="legend-title">{t('legendEventSize', lang)}</div>
      {[
        { key: 'small', d: 8 },
        { key: 'medium', d: 14 },
        { key: 'large', d: 22 },
      ].map(s => (
        <div key={s.key} className="legend-size-row">
          <div className="legend-size-dot" style={{ width: s.d, height: s.d }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t(s.key, lang)}</span>
        </div>
      ))}

      <hr className="legend-divider" />
      <div className="legend-item">
        <div className="legend-dot legend-dot-premiere" />
        <span>{t('firstTime', lang)}</span>
      </div>
    </div>
  )
}
