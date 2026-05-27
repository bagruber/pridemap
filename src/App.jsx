import { useState, useMemo } from 'react'
import Map from './components/Map.jsx'
import FilterSidebar from './components/FilterSidebar.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import Legend from './components/Legend.jsx'
import paradesRaw from './data/parades.json'
import { daysUntil } from './utils/timeColors.js'

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

const parades = paradesRaw.map(p => ({
  ...p,
  daysUntil: daysUntil(p.date, TODAY),
}))

const ALL_COUNTRIES = [...new Set(parades.map(p => p.country))].sort()

export const VIEWS = {
  europe: {
    label: 'Europe',
    center: [15, 52],
    zoom: 4,
    bounds: [[-35, 24], [55, 73]],
    defaultSizes: ['medium', 'large'],
  },
  dach: {
    label: 'DACH',
    center: [11, 50.5],
    zoom: 5.8,
    bounds: [[4.0, 45.5], [18.5, 56.0]],
    defaultSizes: [],
  },
}

export default function App() {
  const [selectedParade, setSelectedParade] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [view, setView] = useState('europe')
  const [filters, setFilters] = useState({
    countries: [],
    sizes: VIEWS.europe.defaultSizes,
    timeframe: 'upcoming',
  })
  const [isoOrigin, setIsoOrigin] = useState(null)
  const [isoMode, setIsoMode] = useState('driving-car')
  const [isoPinning, setIsoPinning] = useState(false)

  function switchView(v) {
    setView(v)
    setFilters(f => ({ ...f, sizes: VIEWS[v].defaultSizes }))
  }

  const filteredParades = useMemo(() => {
    return parades.filter(p => {
      if (filters.countries.length > 0 && !filters.countries.includes(p.country)) return false
      if (filters.sizes.length > 0 && !filters.sizes.includes(p.size)) return false
      if (filters.timeframe === 'upcoming' && p.daysUntil < 0) return false
      if (filters.timeframe === 'past' && p.daysUntil >= 0) return false
      return true
    })
  }, [filters])

  const activeFilterCount = filters.countries.length + filters.sizes.length +
    (filters.timeframe !== 'upcoming' ? 1 : 0)

  return (
    <div className="app">
      <Map
        parades={filteredParades}
        onSelect={setSelectedParade}
        view={view}
        isoOrigin={isoOrigin}
        onIsoOriginSet={setIsoOrigin}
        isoMode={isoMode}
        isoPinning={isoPinning}
        onPinningDone={() => setIsoPinning(false)}
      />

      <button
        className={`sidebar-toggle ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(v => !v)}
        aria-label="Toggle filters"
      >
        <span className="toggle-icon">{sidebarOpen ? '✕' : '☰'}</span>
        {!sidebarOpen && activeFilterCount > 0 && (
          <span className="filter-badge">{activeFilterCount}</span>
        )}
      </button>

      {sidebarOpen && (
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          allCountries={ALL_COUNTRIES}
          totalCount={filteredParades.length}
          view={view}
          onViewChange={switchView}
        />
      )}

      {selectedParade && (
        <DetailPanel
          parade={selectedParade}
          onClose={() => setSelectedParade(null)}
        />
      )}

      <div className="isochrone-controls">
        <div className="iso-title">Travel time</div>
        <div className="iso-mode-row">
          {[
            { value: 'driving-car', label: 'Car' },
            { value: 'cycling-regular', label: 'Cycling' },
          ].map(m => (
            <button
              key={m.value}
              className={`toggle-btn ${isoMode === m.value ? 'active' : ''}`}
              onClick={() => setIsoMode(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          className={`iso-pin-btn ${isoPinning ? 'pinning' : ''}`}
          onClick={() => {
            if (isoOrigin) {
              setIsoOrigin(null)
            } else {
              setIsoPinning(v => !v)
            }
          }}
        >
          {isoOrigin ? 'Clear origin' : isoPinning ? 'Click map…' : 'Set origin'}
        </button>
        {isoOrigin && (
          <div className="iso-legend">
            {[
              { min: 30, color: 'rgba(255,45,120,0.55)' },
              { min: 60, color: 'rgba(255,149,0,0.55)' },
              { min: 90, color: 'rgba(52,199,89,0.55)' },
              { min: 120, color: 'rgba(10,132,255,0.55)' },
            ].map(b => (
              <div key={b.min} className="iso-legend-item">
                <div className="iso-legend-swatch" style={{ background: b.color }} />
                <span>{b.min} min</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Legend />
    </div>
  )
}
