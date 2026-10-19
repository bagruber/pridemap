import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react'
import { LocateFixed, Menu, X } from 'lucide-react'
import FilterSidebar from './components/FilterSidebar.jsx'
import MobileSheet from './components/MobileSheet.jsx'
import IsoFAB from './components/IsoFAB.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import Legend from './components/Legend.jsx'
import ListView from './components/ListView.jsx'
import MapSearch from './components/MapSearch.jsx'
import Toast from './components/Toast.jsx'
import EmptyState from './components/EmptyState.jsx'
import AboutDialog from './components/AboutDialog.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import pridesRaw from './data/prides.json'
import { editionsFor } from './utils/edition.js'
import { filterParades } from './utils/filter.js'
import { useLang } from './contexts/LangContext.jsx'
import { t, tf } from './utils/i18n.js'
import { useIsMobile } from './hooks/useIsMobile.js'
import { VIEWS } from './config/views.js'
import { ISO_BANDS } from './config/isoBands.js'
import { readHash, writeHash } from './utils/urlState.js'

// Lazy so maplibre-gl lands in its own chunk; only loaded once the map is shown
const Map = lazy(() => import('./components/Map.jsx'))

// Optional ?date=YYYY-MM-DD pins "today" to a fixed day for the whole session
// (used by the walkthrough to record from a past date's perspective). It's a
// query param, not a hash key, so it survives the app's hash rewriting.
function startOfToday() {
  const override = new URLSearchParams(window.location.search).get('date')
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) {
    const [y, m, d] = override.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    if (!Number.isNaN(dt.getTime())) { dt.setHours(0, 0, 0, 0); return dt }
  }
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const ALL_COUNTRIES = [...new Set(pridesRaw.map(p => p.country))].sort()

// Links shared before the ids became stable still carry the old event id.
// A plain object, not a Map — `Map` is the lazy map component up there.
const BY_LEGACY_ID = Object.fromEntries(
  pridesRaw.flatMap(p => (p.legacyIds ?? []).map(old => [old, p.id])),
)
const resolveId = id => (id == null ? null : BY_LEGACY_ID[id] ?? id)

const INITIAL_HASH = readHash()

export default function App() {
  const { lang } = useLang()
  const isMobile = useIsMobile()
  const [today, setToday] = useState(startOfToday)
  const [view, setView] = useState(INITIAL_HASH?.view ?? 'europe')
  const [viewMode, setViewMode] = useState(INITIAL_HASH?.viewMode ?? 'map')
  const [filters, setFilters] = useState({
    countries: INITIAL_HASH?.countries ?? [],
    sizes: INITIAL_HASH?.sizes ?? VIEWS[INITIAL_HASH?.view ?? 'europe'].defaultSizes,
    timeframe: INITIAL_HASH?.timeframe ?? 'upcoming',
    months: INITIAL_HASH?.months ?? [],
  })
  const [selectedId, setSelectedId] = useState(() => resolveId(INITIAL_HASH?.selectedId))
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isoOrigin, setIsoOrigin] = useState(null)
  const [isoMode, setIsoMode] = useState('driving-car')
  const [isoPinning, setIsoPinning] = useState(false)
  const [flyTo, setFlyTo] = useState(null)
  const [clusteringEnabled, setClusteringEnabled] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  // Mount the map lazily, then keep it mounted to preserve position
  const [mapMounted, setMapMounted] = useState((INITIAL_HASH?.viewMode ?? 'map') === 'map')
  const [booted, setBooted] = useState(false)

  const mapPositionRef = useRef(null)

  // Each Pride seen through the edition that matters today
  const parades = useMemo(() => editionsFor(pridesRaw, today), [today])
  const selectedParade = useMemo(
    () => (selectedId ? parades.find(p => p.id === selectedId) ?? null : null),
    [parades, selectedId],
  )

  // Roll "today" over at midnight / when the tab wakes up, so countdowns stay live
  useEffect(() => {
    const check = () => {
      const now = startOfToday()
      setToday(prev => (prev.getTime() === now.getTime() ? prev : now))
    }
    const id = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  // Sync URL hash
  useEffect(() => {
    writeHash({ view, filters, selectedParade, viewMode })
  }, [view, filters, selectedParade, viewMode])

  // Apply hash edits made after load (writeHash uses replaceState, so no loop)
  useEffect(() => {
    const onHashChange = () => {
      const h = readHash()
      if (!h) return
      setView(h.view)
      setViewMode(h.viewMode)
      setFilters({
        countries: h.countries,
        sizes: h.sizes ?? VIEWS[h.view].defaultSizes,
        timeframe: h.timeframe,
        months: h.months,
      })
      setSelectedId(resolveId(h.selectedId))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (viewMode === 'map' && !mapMounted) setMapMounted(true)
  }, [viewMode, mapMounted])

  // The splash clears on whichever comes first: the map reporting ready, list
  // mode having nothing to wait for, or a ceiling — a stalled tile fetch must
  // never leave someone stuck behind it.
  useEffect(() => {
    if (booted) return
    if (viewMode === 'list') { setBooted(true); return }
    const id = setTimeout(() => setBooted(true), 4000)
    return () => clearTimeout(id)
  }, [booted, viewMode])

  // Hidden demo driver for screen recordings: /?walkthrough plays a scripted tour
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('walkthrough')) return
    import('./demo/walkthrough.js')
      .then(m => m.runWalkthrough())
      .catch(err => console.error('[walkthrough]', err))
  }, [])

  // Escape closes detail panel — unless a dialog is open or the user is typing
  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape' || aboutOpen) return
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aboutOpen])

  function switchView(v) {
    setView(v)
    setFilters(f => ({ ...f, sizes: VIEWS[v].defaultSizes }))
  }

  function switchViewMode(mode) {
    setViewMode(mode)
    if (mode === 'list') setFilters(f => ({ ...f, sizes: [] }))
    else setFilters(f => ({ ...f, sizes: VIEWS[view].defaultSizes }))
  }

  function handleGeolocate() {
    if (!navigator.geolocation) {
      setToastMessage(t('geoUnavailable', lang))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => setFlyTo([pos.coords.longitude, pos.coords.latitude]),
      err => {
        setToastMessage(err.code === 1 ? t('geoDenied', lang) : t('geoUnavailable', lang))
      },
    )
  }

  function handleSearchPick(p) {
    setSelectedId(p.id)
    setFlyTo([p.lon, p.lat])
  }

  function handleShowOnMap() {
    if (selectedParade?.lat == null) return
    if (viewMode !== 'map') switchViewMode('map')
    setFlyTo([selectedParade.lon, selectedParade.lat])
  }

  function clearFilters() {
    setFilters({
      countries: [],
      sizes: viewMode === 'list' ? [] : VIEWS[view].defaultSizes,
      timeframe: 'upcoming',
      months: [],
    })
  }

  const filteredParades = useMemo(
    () => filterParades(parades, filters, today),
    [filters, parades, today],
  )

  // Off-season: "Upcoming" finds next to nothing because the season has passed.
  // Only without the other filters — a filtered miss is a filter problem.
  const offSeason = filters.timeframe === 'upcoming' &&
    filters.countries.length === 0 && filters.months.length === 0 &&
    filteredParades.length < 5

  const activeFilterCount = filters.countries.length + filters.sizes.length +
    filters.months.length + (filters.timeframe !== 'upcoming' ? 1 : 0)

  return (
    <div className="app">
      {/* Map — hidden in list mode but kept mounted to preserve position */}
      {mapMounted && (
        <main className="map-wrap" style={{ display: viewMode === 'map' ? undefined : 'none' }}>
          <Suspense fallback={null}>
            <Map
              parades={filteredParades}
              onSelect={setSelectedId}
              view={view}
              selectedId={selectedParade?.id ?? null}
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
              onReady={() => setBooted(true)}
            />
          </Suspense>
          {viewMode === 'map' && (offSeason || filteredParades.length === 0) && (
            <div className="map-empty-overlay">
              {offSeason ? (
                <EmptyState
                  showIcon={false}
                  title={tf('seasonOver', lang, {
                    year: today.getFullYear(),
                    next: today.getFullYear() + 1,
                  })}
                  action={() => setFilters(f => ({ ...f, timeframe: 'all' }))}
                  actionLabel={tf('showAllSeason', lang, {
                    count: paradesRaw.length,
                    year: today.getFullYear(),
                  })}
                  linkHref="https://forms.gle/oo6vk3QfANXskXku8"
                  linkLabel={t('reportPride', lang)}
                />
              ) : (
                <EmptyState
                  title={t('noEventsMatch', lang)}
                  action={clearFilters}
                  actionLabel={t('clearFilters', lang)}
                />
              )}
            </div>
          )}
        </main>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <ListView
          parades={filteredParades}
          onSelect={setSelectedId}
        />
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <>
          <button
            className={`sidebar-toggle ${sidebarOpen ? 'open' : ''}`}
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle filters"
          >
            <span className="toggle-icon">{sidebarOpen ? <X size={16} /> : <Menu size={16} />}</span>
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
              viewMode={viewMode}
              onViewModeChange={switchViewMode}
              onAboutClick={() => setAboutOpen(true)}
            />
          )}
        </>
      )}

      {viewMode === 'map' && (
        <>
          <MapSearch parades={parades} onPick={handleSearchPick} />
          <button
            className={`geo-btn ${!isMobile && sidebarOpen ? 'open' : ''}`}
            onClick={handleGeolocate}
            aria-label="Go to my location"
            title="Near me"
          >
            <LocateFixed size={16} />
          </button>
        </>
      )}

      {selectedParade && (
        <DetailPanel
          parade={selectedParade}
          onClose={() => setSelectedId(null)}
          onShowOnMap={selectedParade.lat != null ? handleShowOnMap : null}
        />
      )}

      {/* Desktop-only: isochrones, legend — map mode only */}
      {!isMobile && viewMode === 'map' && (
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
      {isMobile && !selectedParade && (
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
            viewMode={viewMode}
            onViewModeChange={switchViewMode}
            onAboutClick={() => setAboutOpen(true)}
          />
          {viewMode === 'map' && (
            <IsoFAB
              isoOrigin={isoOrigin}
              onOriginSet={setIsoOrigin}
              isoMode={isoMode}
              onModeChange={setIsoMode}
              isoPinning={isoPinning}
              onPinningChange={setIsoPinning}
            />
          )}
        </>
      )}

      <LoadingScreen done={booted} />
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  )
}
