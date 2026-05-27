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

export default function App() {
  const [selectedParade, setSelectedParade] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [filters, setFilters] = useState({
    countries: [],
    sizes: [],
    timeframe: 'upcoming',
  })

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
        selectedId={selectedParade?.id}
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
        />
      )}

      {selectedParade && (
        <DetailPanel
          parade={selectedParade}
          onClose={() => setSelectedParade(null)}
        />
      )}

      <Legend />
    </div>
  )
}
