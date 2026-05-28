import { useState, useRef } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useLang } from '../contexts/LangContext.jsx'
import { t } from '../utils/i18n.js'
import ColoredTitle from './ColoredTitle.jsx'
import ShareButton from './ShareButton.jsx'
import { WEEKENDS } from '../utils/filterConstants.js'
import { useFilterHandlers } from '../hooks/useFilterHandlers.js'
import CountryFilter from './filters/CountryFilter.jsx'
import SizeFilter from './filters/SizeFilter.jsx'
import LangToggle from './filters/LangToggle.jsx'
import ViewModeToggle from './filters/ViewModeToggle.jsx'
import RegionToggle from './filters/RegionToggle.jsx'
import ClusterToggle from './filters/ClusterToggle.jsx'

export default function MobileSheet({
  filters, onChange, allCountries, totalCount,
  view, onViewChange,
  clusteringEnabled, onClusteringChange,
  viewMode, onViewModeChange,
  onAboutClick,
}) {
  const { lang } = useLang()
  const STOPS = ['min', 'peek', 'full']
  const [stop, setStop] = useState('peek')
  const dragStartY = useRef(null)
  const { toggleCountry, toggleSize, setTimeframe } = useFilterHandlers(filters, onChange)

  const cycle = dir => {
    const i = STOPS.indexOf(stop)
    setStop(STOPS[Math.max(0, Math.min(STOPS.length - 1, i + dir))])
  }
  const expanded = stop === 'full'

  const onTouchStart = e => { dragStartY.current = e.touches[0].clientY }
  const onTouchEnd  = e => {
    if (dragStartY.current === null) return
    const delta = dragStartY.current - e.changedTouches[0].clientY
    if (delta > 40)  cycle(+1)
    if (delta < -40) cycle(-1)
    dragStartY.current = null
  }

  return (
    <div className={`mobile-sheet stop-${stop} ${expanded ? 'expanded' : ''}`}>
      <div
        className="sheet-handle-row"
        onClick={() => cycle(+1)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="sheet-handle" />
        <ColoredTitle className="app-title sheet-title" />
      </div>

      <div className="sheet-peek">
        <div className="sheet-peek-filters">
          {[
            { value: 'upcoming', key: 'upcoming' },
            { value: 'all',      key: 'all' },
          ].map(tf => (
            <button
              key={tf.value}
              className={`toggle-btn ${filters.timeframe === tf.value ? 'active' : ''}`}
              onClick={e => { e.stopPropagation(); onChange({ ...filters, timeframe: tf.value }) }}
            >
              {t(tf.key, lang)}
            </button>
          ))}
          <button
            className={`toggle-btn ${filters.timeframe === 'weekend' ? 'active' : ''}`}
            onClick={e => { e.stopPropagation(); setTimeframe('weekend') }}
          >
            {t('thisWeekend', lang)}
          </button>
        </div>
        <span className="sheet-count">
          <strong>{totalCount}</strong>
        </span>
        <button
          className="sheet-chevron"
          onClick={() => cycle(expanded ? -1 : +1)}
          aria-label="Toggle filters"
        >
          {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      <div className="sheet-body">
        <div className="sheet-section">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>

        <div className="sheet-top-row">
          <RegionToggle view={view} onViewChange={onViewChange} withLabel />
          <LangToggle />
        </div>

        <div className="sheet-section">
          <div className="filter-label">{t('filterTime', lang)}</div>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${filters.timeframe === 'past' ? 'active' : ''}`}
              onClick={() => onChange({ ...filters, timeframe: 'past' })}
            >
              {t('past', lang)}
            </button>
            <button
              className={`toggle-btn ${filters.timeframe === 'next-weekend' ? 'active' : ''}`}
              onClick={() => setTimeframe('next-weekend')}
            >
              {t(WEEKENDS.find(w => w.value === 'next-weekend').key, lang)}
            </button>
          </div>
        </div>

        <div className="sheet-section">
          <SizeFilter filters={filters} onChange={onChange} toggleSize={toggleSize} />
        </div>

        <div className="sheet-section">
          <CountryFilter
            filters={filters}
            onChange={onChange}
            allCountries={allCountries}
            toggleCountry={toggleCountry}
            listClassName="mobile-country-list"
          />
        </div>

        <div className="sheet-section">
          <ClusterToggle
            clusteringEnabled={clusteringEnabled}
            onClusteringChange={onClusteringChange}
          />
        </div>

        <div className="sheet-footer">
          <span>{t('missingParade', lang)}</span>
          <a
            href="https://forms.gle/oo6vk3QfANXskXku8"
            className="suggest-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('suggestOne', lang)}
          </a>
        </div>
        <div className="sheet-footer-actions">
          <ShareButton />
          <button className="about-link" onClick={onAboutClick}>{t('about', lang)}</button>
        </div>
      </div>
    </div>
  )
}
