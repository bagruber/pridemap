import { TIME_BUCKETS } from '../utils/timeColors.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t } from '../utils/i18n.js'

const GRADIENT = `linear-gradient(90deg, ${TIME_BUCKETS.map(b => b.color).join(', ')})`

export default function MiniLegend({ className = '' }) {
  const { lang } = useLang()
  return (
    <div className={`mini-legend ${className}`} title={t('legendDaysUntil', lang)}>
      <span className="mini-legend-label">{t('legendNow', lang)}</span>
      <div className="mini-legend-bar" style={{ background: GRADIENT }} />
      <span className="mini-legend-label">{t('legendLater', lang)}</span>
    </div>
  )
}
