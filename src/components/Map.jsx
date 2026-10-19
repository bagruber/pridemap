import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { decode } from '@here/flexpolyline'
import Tooltip from './Tooltip.jsx'
import { colorForDays, OPEN_COLOR } from '../utils/timeColors.js'
import { isFirstTime } from '../utils/firstTime.js'
import { VIEWS } from '../config/views.js'
import { ISO_BANDS } from '../config/isoBands.js'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const HERE_KEY = import.meta.env.VITE_HERE_API_KEY

// Radii at the Europe zoom (4). Below that the dots shrink, above they grow,
// so a zoomed-in city does not show the same 4-px speck as the whole continent.
// Overlap at the continental zoom is wanted: it is what density looks like.
const SIZE_RADIUS       = { small: 3.5, medium: 5.5, large: 8.5 }
const SIZE_RADIUS_HOVER = { small: 5.5, medium: 8, large: 11.5 }

// The factor the radius is multiplied by at each zoom level
const ZOOM_SCALE = [[3, 0.72], [4, 1], [6, 1.5], [9, 2.4], [12, 3.2]]

// Two sources for the same data: clustering can't be toggled on a live source,
// so we keep a plain and a clustered copy and switch layer visibility instead
// of rebuilding the map.
const PARADE_SOURCES = ['parades', 'parades-cluster']
const CIRCLE_LAYERS = ['parades-circles', 'parades-circles-cluster']
const CLUSTER_LAYERS = ['parades-circles-cluster', 'clusters-circle', 'clusters-count']

// Past events render at the very back, then the ones still waiting for a date,
// then the dated ones. Beyond that the order stays as-is (source order).
// Past at the very back, then the ones still waiting for a date, then the
// dated ones — and within each band the big dots below the small ones, so a
// small town is never buried under a metropolis.
const CIRCLE_SORT_KEY = [
  '-',
  ['*', 1000, ['case',
    ['boolean', ['get', 'open'], false], 1,
    ['<', ['get', 'daysUntil'], 0], 0,
    2,
  ]],
  ['get', 'radius'],
]

// MapLibre wants the zoom expression on the outside, so the hover case has to
// sit inside every stop rather than wrapping the interpolation.
const CIRCLE_RADIUS = [
  'interpolate', ['linear'], ['zoom'],
  ...ZOOM_SCALE.flatMap(([z, f]) => [z, [
    '*', f,
    ['case',
      ['boolean', ['feature-state', 'hovered'], false],
      ['get', 'radiusHover'],
      ['get', 'radius']],
  ]]),
]

const CIRCLE_PAINT = {
  'circle-radius': CIRCLE_RADIUS,
  // An open date is a ring with nothing in it: the Pride is there, the date
  // is not. Transparent rather than background-coloured, so overlapping dots
  // stay visible through it.
  'circle-color': ['case', ['boolean', ['get', 'open'], false], 'rgba(0,0,0,0)', ['get', 'color']],
  'circle-opacity': 1,
  // First-time prides wear a gold ring as a "premiere sticker", rescheduled ones
  // a pink one. Pink also appears in the time scale, but only ever as a fill —
  // no dot carries it as a stroke — so the two readings never collide.
  // Selection still wins over both.
  'circle-stroke-width': [
    'case',
    ['boolean', ['feature-state', 'selected'], false], 2,
    ['boolean', ['get', 'firstTime'], false], 2,
    ['to-boolean', ['get', 'movedFrom']], 2,
    ['boolean', ['get', 'open'], false], 1.5,
    0.5,
  ],
  'circle-stroke-color': [
    'case',
    ['boolean', ['feature-state', 'selected'], false], '#ffffff',
    ['boolean', ['get', 'firstTime'], false], '#ffd447',
    ['to-boolean', ['get', 'movedFrom']], '#ff2d78',
    ['boolean', ['get', 'open'], false], OPEN_COLOR,
    // Near-black rather than translucent white: on a dark basemap it is the
    // gap between two overlapping dots that has to read, not a halo.
    '#0e0e0e',
  ],
}

// A small event renders as a 4px-radius dot: an easy target with a mouse and a
// near-impossible one with a thumb. So the click is resolved against a padded
// box rather than the exact pixel, and the feature nearest the tap wins.
const HIT_PAD = typeof window !== 'undefined'
  && window.matchMedia?.('(pointer: coarse)').matches ? 18 : 4

function pickAt(map, point) {
  const layers = ['parades-circles', 'parades-circles-cluster', 'clusters-circle']
    .filter(l => map.getLayer(l))
  const hits = map.queryRenderedFeatures(
    [[point.x - HIT_PAD, point.y - HIT_PAD], [point.x + HIT_PAD, point.y + HIT_PAD]],
    { layers },
  )
  if (!hits.length) return null

  let best = hits[0]
  let bestDistance = Infinity
  for (const f of hits) {
    const coords = f.geometry?.coordinates
    if (!coords) continue
    const p = map.project(coords)
    const d = (p.x - point.x) ** 2 + (p.y - point.y) ** 2
    if (d < bestDistance) { bestDistance = d; best = f }
  }
  return best
}

// The 5th to 95th percentile of the coordinates instead of fixed Europe
// bounds. Portrait and landscape then both open on where the Prides actually
// are, rather than fitting a wide rectangle into a tall screen and filling it
// with Scandinavia.
function dataBounds(parades) {
  const lons = [], lats = []
  for (const p of parades) {
    if (p.lon == null || p.lat == null) continue
    lons.push(p.lon); lats.push(p.lat)
  }
  if (lons.length < 10) return null
  lons.sort((a, b) => a - b); lats.sort((a, b) => a - b)
  const at = (arr, q) => arr[Math.floor((arr.length - 1) * q)]
  return [[at(lons, 0.05), at(lats, 0.05)], [at(lons, 0.95), at(lats, 0.95)]]
}

const fitPadding = () =>
  (typeof window !== 'undefined' && window.innerWidth < 768)
    ? { top: 72, right: 24, bottom: 196, left: 24 }
    : 60

function paradesToGeoJSON(parades) {
  return {
    type: 'FeatureCollection',
    features: parades
      .filter(p => p.lat != null && p.lon != null)
      .map(p => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
        properties: {
          id: p.id,
          name: p.name,
          city: p.city,
          // Flattened, because a map feature's properties hold no objects
          cityDe: p.cityNames?.de ?? p.city,
          cityEn: p.cityNames?.en ?? p.city,
          country: p.country,
          lat: p.lat,
          lon: p.lon,
          date: p.date,
          size: p.size,
          daysUntil: p.daysUntil,
          open: !!p.open,
          lastDate: p.lastDate ?? null,
          color: colorForDays(p.daysUntil),
          radius: SIZE_RADIUS[p.size] ?? 5,
          radiusHover: SIZE_RADIUS_HOVER[p.size] ?? 8,
          queerIndex: p.queerIndex,
          website: p.website ?? null,
          instagram: p.instagram ?? null,
          firstYear: p.firstYear ?? null,
          firstTime: isFirstTime(p),
          movedFrom: p.movedFrom ?? null,
        },
      })),
  }
}

async function fetchIsochrones(lat, lon, isoMode) {
  if (!HERE_KEY) return null
  const mode = isoMode === 'driving-car' ? 'car' : 'bicycle'
  const url = `https://isoline.router.hereapi.com/v8/isolines` +
    `?origin=${lat},${lon}` +
    `&range%5Btype%5D=time` +
    `&range%5Bvalues%5D=1800,3600,5400,7200,9000` +
    `&transportMode=${mode}` +
    `&apiKey=${HERE_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HERE ${res.status}: ${await res.text()}`)
  return res.json()
}

function hereToGeoJSON(data) {
  const bandBySeconds = Object.fromEntries(ISO_BANDS.map(b => [b.seconds, b]))
  const features = data.isolines.map(isoline => {
    const band = bandBySeconds[isoline.range.value] ?? ISO_BANDS[0]
    const rings = isoline.polygons.map(poly => {
      const { polyline } = decode(poly.outer)
      const ring = polyline.map(([lt, lg]) => [lg, lt])
      const first = ring[0], last = ring[ring.length - 1]
      if (first && (first[0] !== last[0] || first[1] !== last[1])) ring.push(first)
      return ring
    })
    return {
      type: 'Feature',
      properties: { value: isoline.range.value, fillColor: band.color, strokeColor: band.stroke },
      geometry: rings.length === 1
        ? { type: 'Polygon', coordinates: [rings[0]] }
        : { type: 'MultiPolygon', coordinates: rings.map(r => [r]) },
    }
  })
  // largest range first so smaller rings render on top
  features.sort((a, b) => b.properties.value - a.properties.value)
  return { type: 'FeatureCollection', features }
}

export default function Map({
  parades, onSelect, view,
  selectedId,
  isoOrigin, onIsoOriginSet,
  isoMode, isoPinning, onPinningDone,
  flyTo, onFlyToDone,
  clusteringEnabled,
  initialPosition, onViewChange, onReady,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const hoveredRef = useRef(null) // { source, id }
  const selectedIdRef = useRef(selectedId)
  // The initial fit runs once, inside the map's load handler, so it needs the
  // current list without re-running the effect when a filter changes.
  const paradesRef = useRef(parades)
  paradesRef.current = parades
  const isoPinningRef = useRef(false)
  const clusteringRef = useRef(clusteringEnabled)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isoLoading, setIsoLoading] = useState(false)
  const [isoError, setIsoError] = useState(null)

  useEffect(() => { isoPinningRef.current = isoPinning }, [isoPinning])

  // ── Initialize map ──────────────────────────────────────────────────────────
  useEffect(() => {
    const { center, zoom } = VIEWS[view] ?? VIEWS.europe
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: initialPosition?.center ?? center,
      zoom: initialPosition?.zoom ?? zoom,
      minZoom: 3,
      maxZoom: 12,
      maxBounds: [[-35, 24], [55, 73]],
      attributionControl: { compact: true },
    })
    mapRef.current = map
    // Debug handle: ?walkthrough needs it to drive the tour, ?maphandle exposes
    // it on its own so UI tests can position the map without a tour running.
    const flags = new URLSearchParams(window.location.search)
    if (flags.has('walkthrough') || flags.has('maphandle')) window.__pridemapMap = map

    map.on('moveend', () => {
      onViewChange?.({ center: map.getCenter().toArray(), zoom: map.getZoom() })
    })

    const clearHover = () => {
      if (hoveredRef.current) {
        map.setFeatureState({ source: hoveredRef.current.source, id: hoveredRef.current.id }, { hovered: false })
        hoveredRef.current = null
      }
    }

    const setHover = f => {
      if (hoveredRef.current?.id !== f.properties.id || hoveredRef.current?.source !== f.source) {
        clearHover()
        hoveredRef.current = { source: f.source, id: f.properties.id }
        map.setFeatureState({ source: f.source, id: f.properties.id }, { hovered: true })
      }
    }

    map.on('load', () => {
      const data = paradesToGeoJSON(parades)
      const clustered = clusteringRef.current

      // ── Parade sources: plain + clustered twin ────────────────────────────
      map.addSource('parades', { type: 'geojson', data, promoteId: 'id' })
      map.addSource('parades-cluster', {
        type: 'geojson',
        data,
        promoteId: 'id',
        cluster: true,
        clusterMaxZoom: 7,
        clusterRadius: 35,
        clusterMinPoints: 4,
      })

      map.addLayer({
        id: 'parades-circles',
        type: 'circle',
        source: 'parades',
        layout: {
          visibility: clustered ? 'none' : 'visible',
          'circle-sort-key': CIRCLE_SORT_KEY,
        },
        paint: CIRCLE_PAINT,
      })
      map.addLayer({
        id: 'parades-circles-cluster',
        type: 'circle',
        source: 'parades-cluster',
        filter: ['!', ['has', 'point_count']],
        layout: {
          visibility: clustered ? 'visible' : 'none',
          'circle-sort-key': CIRCLE_SORT_KEY,
        },
        paint: CIRCLE_PAINT,
      })
      map.addLayer({
        id: 'clusters-circle',
        type: 'circle',
        source: 'parades-cluster',
        filter: ['has', 'point_count'],
        layout: { visibility: clustered ? 'visible' : 'none' },
        paint: {
          'circle-color': '#252525',
          'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 30, 22],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#555',
        },
      })
      map.addLayer({
        id: 'clusters-count',
        type: 'symbol',
        source: 'parades-cluster',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          visibility: clustered ? 'visible' : 'none',
        },
        paint: { 'text-color': '#e8e8e8' },
      })

      // ── Isochrone sources + layers ────────────────────────────────────────
      map.addSource('isochrones', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'iso-fill',
        type: 'fill',
        source: 'isochrones',
        paint: { 'fill-color': ['get', 'fillColor'], 'fill-opacity': 1 },
      }, 'parades-circles')
      map.addLayer({
        id: 'iso-line',
        type: 'line',
        source: 'isochrones',
        paint: { 'line-color': ['get', 'strokeColor'], 'line-width': 1.5, 'line-opacity': 0.9 },
      }, 'parades-circles')

      // ── Origin pin source + layers ────────────────────────────────────────
      map.addSource('origin', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'origin-ring',
        type: 'circle',
        source: 'origin',
        paint: {
          'circle-radius': 10,
          'circle-color': 'transparent',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      })
      map.addLayer({
        id: 'origin-dot',
        type: 'circle',
        source: 'origin',
        paint: { 'circle-radius': 4, 'circle-color': '#ffffff' },
      })

      map.on('mouseenter', 'clusters-circle', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'clusters-circle', () => { map.getCanvas().style.cursor = '' })

      // ── Hover / click handlers (both circle layers) ───────────────────────
      for (const layer of CIRCLE_LAYERS) {
        map.on('mouseenter', layer, (e) => {
          map.getCanvas().style.cursor = 'pointer'
          const f = e.features[0]; if (!f) return
          setHover(f)
          const p = f.properties
          setTooltip({ x: e.point.x, y: e.point.y, name: p.name, city: p.city, cityDe: p.cityDe, cityEn: p.cityEn, country: p.country, date: p.date, daysUntil: p.daysUntil, open: p.open, lastDate: p.lastDate, color: p.color })
        })

        map.on('mousemove', layer, (e) => {
          const f = e.features[0]; if (!f) return
          setHover(f)
          const p = f.properties
          setTooltip({ x: e.point.x, y: e.point.y, name: p.name, city: p.city, cityDe: p.cityDe, cityEn: p.cityEn, country: p.country, date: p.date, daysUntil: p.daysUntil, open: p.open, lastDate: p.lastDate, color: p.color })
        })

        map.on('mouseleave', layer, () => {
          map.getCanvas().style.cursor = ''
          clearHover()
          setTooltip(null)
        })

      }

      // One click handler for dots, clusters and empty map alike, so the
      // pick box below is the only thing deciding what got hit.
      map.on('click', async (e) => {
        if (isoPinningRef.current) return
        const f = pickAt(map, e.point)
        if (!f) { onSelect(null); return }

        if (f.properties.cluster_id != null) {
          const zoom = await map.getSource('parades-cluster')
            .getClusterExpansionZoom(f.properties.cluster_id)
          map.easeTo({ center: f.geometry.coordinates, zoom: zoom + 0.5 })
          return
        }
        onSelect(f.properties.id)
      })

      // Apply selection that existed before the style finished loading
      if (selectedIdRef.current != null) {
        for (const src of PARADE_SOURCES)
          map.setFeatureState({ source: src, id: selectedIdRef.current }, { selected: true })
      }

      // Open on where the Prides are, fitted to this screen's shape — unless
      // we are restoring a position the visitor already chose.
      if (!initialPosition) {
        const b = dataBounds(paradesRef.current)
        if (b) map.fitBounds(b, { padding: fitPadding(), duration: 0 })
      }

      setMapLoaded(true)
      onReady?.()
    })

    return () => map.remove()
  }, [])

  // ── Toggle clustering via layer visibility (no map rebuild) ─────────────────
  useEffect(() => {
    clusteringRef.current = clusteringEnabled
    const map = mapRef.current
    if (!map || !mapLoaded || !map.getLayer('parades-circles')) return
    map.setLayoutProperty('parades-circles', 'visibility', clusteringEnabled ? 'none' : 'visible')
    for (const layer of CLUSTER_LAYERS)
      map.setLayoutProperty(layer, 'visibility', clusteringEnabled ? 'visible' : 'none')
  }, [clusteringEnabled, mapLoaded])

  // ── Sync parade data ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return
    const data = paradesToGeoJSON(parades)
    for (const src of PARADE_SOURCES) map.getSource(src)?.setData(data)
  }, [parades, mapLoaded])

  // ── Highlight selected parade ───────────────────────────────────────────────
  useEffect(() => {
    const prev = selectedIdRef.current
    selectedIdRef.current = selectedId
    const map = mapRef.current
    if (!map || !mapLoaded || !map.getSource('parades')) return
    for (const src of PARADE_SOURCES) {
      if (prev != null) map.setFeatureState({ source: src, id: prev }, { selected: false })
      if (selectedId != null) map.setFeatureState({ source: src, id: selectedId }, { selected: true })
    }
  }, [selectedId, mapLoaded])

  // ── Fly to view on switch ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const cfg = VIEWS[view] ?? VIEWS.europe
    map.fitBounds(dataBounds(paradesRef.current) ?? cfg.bounds, { padding: fitPadding(), duration: 1000 })
  }, [view])

  // ── Fly to geolocated position ──────────────────────────────────────────────
  useEffect(() => {
    if (!flyTo || !mapRef.current) return
    mapRef.current.flyTo({ center: flyTo, zoom: 9, duration: 1200 })
    onFlyToDone()
  }, [flyTo])

  // ── Handle isoPinning cursor ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!isoPinning) { map.getCanvas().style.cursor = ''; return }

    map.getCanvas().style.cursor = 'crosshair'

    function handleClick(e) {
      const { lng, lat } = e.lngLat
      onIsoOriginSet([lng, lat])
      onPinningDone()
    }
    map.once('click', handleClick)
    return () => {
      map.off('click', handleClick)
      map.getCanvas().style.cursor = ''
    }
  }, [isoPinning])

  // ── Fetch + render isochrones when origin or mode changes ───────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const clear = () => {
      if (map.getSource('isochrones')) map.getSource('isochrones').setData({ type: 'FeatureCollection', features: [] })
      if (map.getSource('origin')) map.getSource('origin').setData({ type: 'FeatureCollection', features: [] })
    }

    if (!isoOrigin) { clear(); return }

    const [lon, lat] = isoOrigin

    if (map.getSource('origin')) {
      map.getSource('origin').setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] } }],
      })
    }

    if (!HERE_KEY) {
      setIsoError('Set VITE_HERE_API_KEY in .env to enable isochrones')
      return
    }

    setIsoLoading(true)
    setIsoError(null)

    fetchIsochrones(lat, lon, isoMode)
      .then(data => {
        if (!map.getSource('isochrones')) return
        map.getSource('isochrones').setData(hereToGeoJSON(data))
      })
      .catch(err => setIsoError(err.message))
      .finally(() => setIsoLoading(false))
  }, [isoOrigin, isoMode])

  return (
    <>
      <div ref={containerRef} className="map-container" />
      {tooltip && <Tooltip {...tooltip} />}
      {isoLoading && <div className="iso-loading">Loading isochrones…</div>}
      {isoError && <div className="iso-error">{isoError}</div>}
    </>
  )
}
