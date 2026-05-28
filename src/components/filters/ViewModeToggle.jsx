import { useLang } from '../../contexts/LangContext.jsx'
import { t } from '../../utils/i18n.js'

export default function ViewModeToggle({ viewMode, onViewModeChange }) {
  const { lang } = useLang()
  return (
    <div className="toggle-group">
      <button
        className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
        onClick={() => onViewModeChange('map')}
      >{t('mapView', lang)}</button>
      <button
        className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => onViewModeChange('list')}
      >{t('listView', lang)}</button>
    </div>
  )
}
