import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { decode } from '@here/flexpolyline'
import Tooltip from './Tooltip.jsx'
import { colorForDays } from '../utils/timeColors.js'
import { toSelection } from '../utils/parade.js'
import { VIEWS } from '../config/views.js'
import { ISO_BANDS } from '../config/isoBands.js'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const HERE_KEY = import.meta.env.VITE_HERE_API_KEY

const SIZE_RADIUS       = { small: 4, medium: 7, large: 11 }
const SIZE_RADIUS_HOVER = { small: 6, medium: 10, large: 14 }

// Two sources for the same data: clustering can't be toggled on a live source,
// so we keep a plain and a clustered copy and switch layer visibility instead
// of rebuilding the map.
const PARADE_SOURCES = ['parades', 'parades-cluster']
const CIRCLE_LAYERS = ['parades-circles', 'parades-circles-cluster']
const CLUSTER_LAYERS = ['parades-circles-cluster', 'clusters-circle', 'clusters-count']

// Past events render at the very back; upcoming dots always sit on top.
// Beyond that the order intentionally stays as-is (source order).
const CIRCLE_SORT_KEY = ['case', ['<', ['get', 'daysUntil'], 0], 0, 1]

const CIRCLE_PAINT = {
  'circle-radius': [
    'case',
    ['boolean', ['feature-state', 'hovered'], false],
    ['get', 'radiusHover'],
    ['get', 'radius'],
  ],
  'circle-color': ['get', 'color'],
  'circle-opacity': 1,
  'circle-stroke-width': [
    'case',
    ['boolean', ['feature-state', 'selected'], false], 2, 0.5,
  ],
  'circle-stroke-color': [
    'case',
    ['boolean', ['feature-state', 'selected'], false],
    '#ffffff', 'rgba(255,255,255,0.15)',
  ],
}

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
          country: p.country,
          lat: p.lat,
          lon: p.lon,
          date: p.date,
          size: p.size,
          daysUntil: p.daysUntil,
          color: colorForDays(p.daysUntil),
          radius: SIZE_RADIUS[p.size] ?? 5,
          radiusHover: SIZE_RADIUS_HOVER[p.size] ?? 8,
          queerIndex: p.queerIndex,
          website: p.website ?? null,
          instagram: p.instagram ?? null,
          firstYear: p.firstYear ?? null,
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
  initialPosition, onViewChange,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const hoveredRef = useRef(null) // { source, id }
  const selectedIdRef = useRef(selectedId)
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

      // ── Cluster click → zoom in ───────────────────────────────────────────
      map.on('click', 'clusters-circle', async (e) => {
        if (isoPinningRef.current) return
        const feature = e.features[0]; if (!feature) return
        const zoom = await map.getSource('parades-cluster').getClusterExpansionZoom(feature.properties.cluster_id)
        map.easeTo({ center: feature.geometry.coordinates, zoom: zoom + 0.5 })
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
          setTooltip({ x: e.point.x, y: e.point.y, name: p.name, city: p.city, country: p.country, date: p.date, daysUntil: p.daysUntil, color: p.color })
        })

        map.on('mousemove', layer, (e) => {
          const f = e.features[0]; if (!f) return
          setHover(f)
          const p = f.properties
          setTooltip({ x: e.point.x, y: e.point.y, name: p.name, city: p.city, country: p.country, date: p.date, daysUntil: p.daysUntil, color: p.color })
        })

        map.on('mouseleave', layer, () => {
          map.getCanvas().style.cursor = ''
          clearHover()
          setTooltip(null)
        })

        map.on('click', layer, (e) => {
          if (isoPinningRef.current) return
          const f = e.features[0]; if (!f) return
          onSelect(toSelection(f.properties))
        })
      }

      // Click on empty map → deselect (hidden layers return no features)
      map.on('click', (e) => {
        if (isoPinningRef.current) return
        const hits = map.queryRenderedFeatures(e.point, {
          layers: ['parades-circles', 'parades-circles-cluster', 'clusters-circle'],
        })
        if (!hits.length) onSelect(null)
      })

      // Apply selection that existed before the style finished loading
      if (selectedIdRef.current != null) {
        for (const src of PARADE_SOURCES)
          map.setFeatureState({ source: src, id: selectedIdRef.current }, { selected: true })
      }

      setMapLoaded(true)
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
    map.fitBounds(cfg.bounds, { padding: 60, duration: 1000 })
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
