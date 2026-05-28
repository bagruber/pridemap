import { VIEW_OPTIONS } from '../../utils/filterConstants.js'
import { useLang } from '../../contexts/LangContext.jsx'
import { t } from '../../utils/i18n.js'

export default function RegionToggle({ view, onViewChange, withLabel = false }) {
  const { lang } = useLang()
  return (
    <div className="view-toggle">
      {VIEW_OPTIONS.map(v => (
        <button
          key={v.value}
          className={`view-btn ${view === v.value ? 'active' : ''}`}
          onClick={() => onViewChange(v.value)}
        >
          <img
            src={`${import.meta.env.BASE_URL}${v.img}`}
            className="view-flag"
            alt={withLabel ? '' : t(v.labelKey, lang)}
          />
          {withLabel
            ? <span className="view-btn-label">{t(v.labelKey, lang)}</span>
            : <> {t(v.labelKey, lang)}</>}
        </button>
      ))}
    </div>
  )
}
