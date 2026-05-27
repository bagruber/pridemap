import { useState, useMemo, useEffect, useRef } from 'react'
import { LocateFixed } from 'lucide-react'
import Map, { ISO_BANDS } from './components/Map.jsx'
import FilterSidebar from './components/FilterSidebar.jsx'
import MobileSheet from './components/MobileSheet.jsx'
import IsoFAB from './components/IsoFAB.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import Legend from './components/Legend.jsx'
import paradesRaw from './data/parades.json'
import { daysUntil, colorForDays } from './utils/timeColors.js'
import { useLang } from './contexts/LangContext.jsx'
import { t } from './utils/i18n.js'
import { useIsMobile } from './hooks/useIsMobile.js'

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

const VALID_TIMEFRAMES = ['upcoming', 'past', 'all', 'weekend', 'next-weekend']

const INITIAL_HASH = (() => {
  try {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const view = ['europe', 'dach'].includes(params.get('view')) ? params.get('view') : 'europe'
    return {
      view,
      timeframe: VALID_TIMEFRAMES.includes(params.get('timeframe')) ? params.get('timeframe') : 'upcoming',
      sizes: params.has('sizes')
        ? params.get('sizes').split(',').filter(s => ['small', 'medium', 'large'].includes(s))
        : null,
      countries: params.has('countries')
        ? params.get('countries').split(',').filter(c => c.length >= 2)
        : [],
      selectedId: params.has('selected') ? Number(params.get('selected')) : null,
    }
  } catch { return null }
})()

export default function App() {
  const { lang } = useLang()
  const isMobile = useIsMobile()
  const [view, setView] = useState(INITIAL_HASH?.view ?? 'europe')
  const [filters, setFilters] = useState({
    countries: INITIAL_HASH?.countries ?? [],
    sizes: INITIAL_HASH?.sizes ?? VIEWS[INITIAL_HASH?.view ?? 'europe'].defaultSizes,
    timeframe: INITIAL_HASH?.timeframe ?? 'upcoming',
  })
  const [selectedParade, setSelectedParade] = useState(() => {
    if (!INITIAL_HASH?.selectedId) return null
    const p = parades.find(p => p.id === INITIAL_HASH.selectedId)
    if (!p) return null
    return { id: p.id, name: p.name, city: p.city, country: p.country, date: p.date, size: p.size, daysUntil: p.daysUntil, color: colorForDays(p.daysUntil), queerIndex: p.queerIndex, website: p.website, firstYear: p.firstYear }
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isoOrigin, setIsoOrigin] = useState(null)
  const [isoMode, setIsoMode] = useState('driving-car')
  const [isoPinning, setIsoPinning] = useState(false)
  const [flyTo, setFlyTo] = useState(null)
  const [clusteringEnabled, setClusteringEnabled] = useState(false)

  // Preserve map position across clustering remounts
  const mapPositionRef = useRef(null)

  // Sync URL hash
  useEffect(() => {
    const params = new URLSearchParams()
    if (view !== 'europe') params.set('view', view)
    if (filters.timeframe !== 'upcoming') params.set('timeframe', filters.timeframe)
    const def = VIEWS[view].defaultSizes
    if (filters.sizes.length !== def.length || filters.sizes.some(s => !def.includes(s)))
      params.set('sizes', filters.sizes.join(','))
    if (filters.countries.length) params.set('countries', filters.countries.join(','))
    if (selectedParade) params.set('selected', selectedParade.id)
    const qs = params.toString()
    history.replaceState(null, '', qs ? `#${qs}` : location.pathname + location.search)
  }, [view, filters, selectedParade])

  // Escape closes detail panel
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') setSelectedParade(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function switchView(v) {
    setView(v)
    setFilters(f => ({ ...f, sizes: VIEWS[v].defaultSizes }))
  }

  function handleGeolocate() {
    navigator.geolocation.getCurrentPosition(
      pos => setFlyTo([pos.coords.longitude, pos.coords.latitude]),
      () => {}
    )
  }

  const filteredParades = useMemo(() => {
    const dow = TODAY.getDay()
    let weekendSat
    if (dow === 6) weekendSat = TODAY
    else if (dow === 0) weekendSat = new Date(TODAY.getTime() - 86400000)
    else weekendSat = new Date(TODAY.getTime() + (6 - dow) * 86400000)
    const weekendSun = new Date(weekendSat.getTime() + 86400000)
    const nextWeekendSat = new Date(weekendSat.getTime() + 7 * 86400000)
    const nextWeekendSun = new Date(weekendSun.getTime() + 7 * 86400000)

    return parades.filter(p => {
      if (filters.countries.length > 0 && !filters.countries.includes(p.country)) return false
      if (filters.sizes.length > 0 && !filters.sizes.includes(p.size)) return false
      if (filters.timeframe === 'upcoming' && p.daysUntil < 0) return false
      if (filters.timeframe === 'past' && p.daysUntil >= 0) return false
      if (filters.timeframe === 'weekend') {
        const d = new Date(p.date); d.setHours(0, 0, 0, 0)
        if (d < weekendSat || d > weekendSun) return false
      }
      if (filters.timeframe === 'next-weekend') {
        const d = new Date(p.date); d.setHours(0, 0, 0, 0)
        if (d < nextWeekendSat || d > nextWeekendSun) return false
      }
      return true
    })
  }, [filters])

  const activeFilterCount = filters.countries.length + filters.sizes.length +
    (filters.timeframe !== 'upcoming' ? 1 : 0)

  return (
    <div className="app">
      <Map
        key={clusteringEnabled ? 'clustered' : 'plain'}
        parades={filteredParades}
        onSelect={setSelectedParade}
        view={view}
        isoOrigin={isoOrigin}
        onIsoOriginSet={setIsoOrigin}
        isoMode={isoMode}
        isoPinning={isoPinning}
        onPinningDone={() => setIsoPinning(false)}
        flyTo={flyTo}
        onFlyToDone={() => setFlyTo(null)}
        clusteringEnabled={clusteringEnabled}
        initialPosition={mapPositionRef.current}
        onViewChange={pos => { mapPositionRef.current = pos }}
      />

      {/* Desktop sidebar */}
      {!isMobile && (
        <>
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
              clusteringEnabled={clusteringEnabled}
              onClusteringChange={setClusteringEnabled}
            />
          )}
        </>
      )}

      <button
        className={`geo-btn ${!isMobile && sidebarOpen ? 'open' : ''}`}
        onClick={handleGeolocate}
        aria-label="Go to my location"
        title="Near me"
      >
        <LocateFixed size={16} />
      </button>

      {selectedParade && (
        <DetailPanel
          parade={selectedParade}
          onClose={() => setSelectedParade(null)}
        />
      )}

      {/* Desktop-only: isochrones, legend */}
      {!isMobile && (
        <>
          <div className="isochrone-controls">
            <div className="iso-title">{t('isoTravelTime', lang)} <span className="iso-beta">beta</span></div>
            <div className="iso-mode-row">
              {[
                { value: 'driving-car', labelKey: 'isoCar' },
                { value: 'cycling-regular', labelKey: 'isoCycling' },
              ].map(m => (
                <button
                  key={m.value}
                  className={`toggle-btn ${isoMode === m.value ? 'active' : ''}`}
                  onClick={() => setIsoMode(m.value)}
                >
                  {t(m.labelKey, lang)}
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
              {isoOrigin ? t('isoClearOrigin', lang) : isoPinning ? t('isoClickMap', lang) : t('isoSetOrigin', lang)}
            </button>
            {isoOrigin && (
              <div className="iso-legend">
                {[...ISO_BANDS].reverse().map(b => (
                  <div key={b.seconds} className="iso-legend-item">
                    <div className="iso-legend-swatch" style={{ background: b.stroke.replace('0.5)', '0.55)') }} />
                    <span>{b.seconds / 60} {t('isoMin', lang)}</span>
                  </div>
                ))}
              </div>
            )}
            <a
              className="iso-here-attr"
              href="https://www.here.com"
              target="_blank"
              rel="noopener noreferrer"
            >Powered by HERE</a>
          </div>

          <Legend />
        </>
      )}

      {/* Mobile bottom sheet + isochrone FAB */}
      {isMobile && (
        <>
          <MobileSheet
            filters={filters}
            onChange={setFilters}
            allCountries={ALL_COUNTRIES}
            totalCount={filteredParades.length}
            view={view}
            onViewChange={switchView}
            clusteringEnabled={clusteringEnabled}
            onClusteringChange={setClusteringEnabled}
          />
          <IsoFAB
            isoOrigin={isoOrigin}
            onOriginSet={setIsoOrigin}
            isoMode={isoMode}
            onModeChange={setIsoMode}
            isoPinning={isoPinning}
            onPinningChange={setIsoPinning}
          />
        </>
      )}
    </div>
  )
}
