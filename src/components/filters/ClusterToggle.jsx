import FilterLabel from './FilterLabel.jsx'
import { useLang } from '../../contexts/LangContext.jsx'
import { t } from '../../utils/i18n.js'

export default function ClusterToggle({ clusteringEnabled, onClusteringChange }) {
  const { lang } = useLang()
  return (
    <>
      <FilterLabel>{t('filterDisplay', lang)}</FilterLabel>
      <label className="display-toggle-row">
        <input
          type="checkbox"
          checked={clusteringEnabled}
          onChange={e => onClusteringChange(e.target.checked)}
        />
        <span>{t('clusterMarkers', lang)}</span>
      </label>
    </>
  )
}
