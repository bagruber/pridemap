import { useLang } from '../contexts/LangContext.jsx'
import { t } from '../utils/i18n.js'
import ColoredTitle from './ColoredTitle.jsx'
import ShareButton from './ShareButton.jsx'
import { TIMEFRAMES, WEEKENDS } from '../utils/filterConstants.js'
import { useFilterHandlers } from '../hooks/useFilterHandlers.js'
import CountryFilter from './filters/CountryFilter.jsx'
import SizeFilter from './filters/SizeFilter.jsx'
import MonthFilter from './filters/MonthFilter.jsx'
import LangToggle from './filters/LangToggle.jsx'
import ViewModeToggle from './filters/ViewModeToggle.jsx'
import RegionToggle from './filters/RegionToggle.jsx'
import ClusterToggle from './filters/ClusterToggle.jsx'

export default function FilterSidebar({
  filters, onChange, allCountries, totalCount,
  view, onViewChange,
  clusteringEnabled, onClusteringChange,
  viewMode, onViewModeChange,
  onAboutClick,
}) {
  const { lang } = useLang()
  const { toggleCountry, toggleSize, toggleMonth, setTimeframe } = useFilterHandlers(filters, onChange)

  return (
    <div className="filter-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <ColoredTitle />
          <LangToggle />
        </div>
        <RegionToggle view={view} onViewChange={onViewChange} />
        <div className="sidebar-mode-row">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          <div className="sidebar-count">
            {t('showingEvents', lang)} <strong>{totalCount}</strong> {t('events', lang)}
          </div>
        </div>
      </div>

      <div className="sidebar-body">
        <div className="filter-group">
          <div className="filter-label">{t('filterTime', lang)}</div>
          <div className="toggle-group">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                className={`toggle-btn ${filters.timeframe === tf.value ? 'active' : ''}`}
                onClick={() => onChange({ ...filters, timeframe: tf.value })}
              >
                {t(tf.key, lang)}
              </button>
            ))}
          </div>
          <div className="toggle-group weekend-group">
            {WEEKENDS.map(w => (
              <button
                key={w.value}
                className={`toggle-btn ${filters.timeframe === w.value ? 'active' : ''}`}
                onClick={() => setTimeframe(w.value)}
              >
                {t(w.key, lang)}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <MonthFilter filters={filters} onChange={onChange} toggleMonth={toggleMonth} />
        </div>

        <div className="filter-group">
          <SizeFilter filters={filters} onChange={onChange} toggleSize={toggleSize} />
        </div>

        <div className="filter-group">
          <CountryFilter
            filters={filters}
            onChange={onChange}
            allCountries={allCountries}
            toggleCountry={toggleCountry}
          />
        </div>

        <div className="filter-group">
          <ClusterToggle
            clusteringEnabled={clusteringEnabled}
            onClusteringChange={onClusteringChange}
          />
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-row">
          <span>{t('missingParade', lang)}</span>
          <a href="https://forms.gle/oo6vk3QfANXskXku8" className="suggest-link" target="_blank" rel="noopener noreferrer">
            {t('suggestOne', lang)}
          </a>
        </div>
        <div className="sidebar-footer-row">
          <ShareButton />
          <button className="about-link" onClick={onAboutClick}>{t('about', lang)}</button>
        </div>
      </div>
    </div>
  )
}
