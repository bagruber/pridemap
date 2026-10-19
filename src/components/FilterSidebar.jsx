import { useLang } from '../contexts/LangContext.jsx'
import { t, tf } from '../utils/i18n.js'
import ColoredTitle from './ColoredTitle.jsx'
import ShareButton from './ShareButton.jsx'
import { useFilterHandlers } from '../hooks/useFilterHandlers.js'
import CountryPicker from './filters/CountryPicker.jsx'
import SizeFilter from './filters/SizeFilter.jsx'
import MonthFilter from './filters/MonthFilter.jsx'
import TimeFilter from './filters/TimeFilter.jsx'
import FilterLabel from './filters/FilterLabel.jsx'
import SidebarSection from './SidebarSection.jsx'
import Legend from './Legend.jsx'
import LangToggle from './filters/LangToggle.jsx'
import ViewModeToggle from './filters/ViewModeToggle.jsx'
import RegionToggle from './filters/RegionToggle.jsx'
import ClusterToggle from './filters/ClusterToggle.jsx'

export default function FilterSidebar({
  filters, onChange, allCountries, countryCounts, totalCount, openCount, today,
  view, onViewChange,
  clusteringEnabled, onClusteringChange,
  viewMode, onViewModeChange,
  onAboutClick, isoSlot,
}) {
  const { lang } = useLang()
  const { toggleCountry, toggleSize, toggleMonth } = useFilterHandlers(filters, onChange)

  return (
    <aside className="filter-sidebar" aria-label="Filters">
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <ColoredTitle today={today} />
          <LangToggle />
        </div>
        <RegionToggle view={view} onViewChange={onViewChange} />
        <div className="sidebar-mode-row">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          <div className="sidebar-count">
            {tf(totalCount - openCount === 1 ? 'countDatesOne' : 'countDates', lang,
            { dated: totalCount - openCount, open: openCount })}
          </div>
        </div>
      </div>

      <div className="sidebar-body">
        <div className="filter-group">
          <FilterLabel>{t('filterTime', lang)}</FilterLabel>
          <TimeFilter filters={filters} onChange={onChange} />
        </div>

        <div className="filter-group">
          <MonthFilter filters={filters} onChange={onChange} toggleMonth={toggleMonth} />
        </div>

        <div className="filter-group">
          <SizeFilter filters={filters} onChange={onChange} toggleSize={toggleSize} />
        </div>

        <div className="filter-group">
          <FilterLabel
            onClear={filters.countries.length > 0 ? () => onChange({ ...filters, countries: [] }) : null}
            clearCount={filters.countries.length}
          >
            {t('filterCountry', lang)}
          </FilterLabel>
          <CountryPicker
            filters={filters}
            onChange={onChange}
            allCountries={allCountries}
            counts={countryCounts}
            toggleCountry={toggleCountry}
          />
        </div>

        <div className="filter-group">
          <ClusterToggle
            clusteringEnabled={clusteringEnabled}
            onClusteringChange={onClusteringChange}
          />
        </div>

        {/* The right edge belongs to the detail column now, so what used to
            float there folds in here. */}
        <SidebarSection title={t('legendEventSize', lang)} defaultOpen>
          <Legend />
        </SidebarSection>
        {isoSlot && (
          <SidebarSection title={t('isoTravelTime', lang)}>{isoSlot}</SidebarSection>
        )}
      </div>

      <footer className="sidebar-footer">
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
      </footer>
    </aside>
  )
}
