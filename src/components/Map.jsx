import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { decode } from '@here/flexpolyline'
import Tooltip from './Tooltip.jsx'
import { colorForDays } from '../utils/timeColors.js'
import { VIEWS } from '../App.jsx'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const HERE_KEY = import.meta.env.VITE_HERE_API_KEY

const SIZE_RADIUS       = { small: 4, medium: 7, large: 11 }
const SIZE_RADIUS_HOVER = { small: 6, medium: 10, large: 14 }

// 30 / 60 / 90 / 120 / 150 min bands, outer → inner
export const ISO_BANDS = [
  { seconds: 9000, color: 'rgba(124,58,237,0.12)', stroke: 'rgba(124,58,237,0.5)' },
  { seconds: 7200, color: 'rgba(10,132,255,0.12)',  stroke: 'rgba(10,132,255,0.5)' },
  { seconds: 5400, color: 'rgba(52,199,89,0.12)',   stroke: 'rgba(52,199,89,0.5)'  },
  { seconds: 3600, color: 'rgba(255,149,0,0.12)',   stroke: 'rgba(255,149,0,0.5)'  },
  { seconds: 1800, color: 'rgba(255,45,120,0.12)',  stroke: 'rgba(255,45,120,0.5)' },
]

function paradesToGeoJSON(parades) {
  return {
    type: 'FeatureCollection',
    features: parades
      .filter(p => p.lat != null && p.lon != null)
      .map(p => ({
        type: 'Feature',
        id: p.id,
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
        properties: {
          id: p.id,
          name: p.name,
          city: p.city,
          country: p.country,
          date: p.date,
          size: p.size,
          daysUntil: p.daysUntil,
          color: colorForDays(p.daysUntil),
          radius: SIZE_RADIUS[p.size] ?? 5,
          radiusHover: SIZE_RADIUS_HOVER[p.size] ?? 8,
          queerIndex: p.queerIndex,
          website: p.website ?? null,
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
  isoOrigin, onIsoOriginSet,
  isoMode, isoPinning, onPinningDone,
  flyTo, onFlyToDone,
  clusteringEnabled,
  initialPosition, onViewChange,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const hoveredId = useRef(null)
  const isoPinningRef = useRef(false)
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

    map.on('load', () => {
      // ── Parade source ─────────────────────────────────────────────────────
      map.addSource('parades', {
        type: 'geojson',
        data: paradesToGeoJSON(parades),
        generateId: false,
        ...(clusteringEnabled ? { cluster: true, clusterMaxZoom: 7, clusterRadius: 35, clusterMinPoints: 4 } : {}),
      })

      // Parade dots (filtered to unclustered only when clustering is on)
      map.addLayer({
        id: 'parades-circles',
        type: 'circle',
        source: 'parades',
        ...(clusteringEnabled ? { filter: ['!', ['has', 'point_count']] } : {}),
        paint: {
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
        },
      })

      if (clusteringEnabled) {
        map.addLayer({
          id: 'clusters-circle',
          type: 'circle',
          source: 'parades',
          filter: ['has', 'point_count'],
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
          source: 'parades',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 11,
          },
          paint: { 'text-color': '#e8e8e8' },
        })
      }

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
      if (clusteringEnabled) {
        map.on('click', 'clusters-circle', async (e) => {
          if (isoPinningRef.current) return
          const feature = e.features[0]; if (!feature) return
          const zoom = await map.getSource('parades').getClusterExpansionZoom(feature.properties.cluster_id)
          map.easeTo({ center: feature.geometry.coordinates, zoom: zoom + 0.5 })
        })
        map.on('mouseenter', 'clusters-circle', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'clusters-circle', () => { map.getCanvas().style.cursor = '' })
      }

      // ── Hover / click handlers ────────────────────────────────────────────
      map.on('mouseenter', 'parades-circles', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const f = e.features[0]; if (!f) return
        if (hoveredId.current !== null)
          map.setFeatureState({ source: 'parades', id: hoveredId.current }, { hovered: false })
        hoveredId.current = f.id
        map.setFeatureState({ source: 'parades', id: f.id }, { hovered: true })
        const p = f.properties
        setTooltip({ x: e.point.x, y: e.point.y, name: p.name, city: p.city, country: p.country, date: p.date, daysUntil: p.daysUntil, color: p.color })
      })

      map.on('mousemove', 'parades-circles', (e) => {
        const f = e.features[0]; if (!f) return
        if (hoveredId.current !== f.id) {
          if (hoveredId.current !== null)
            map.setFeatureState({ source: 'parades', id: hoveredId.current }, { hovered: false })
          hoveredId.current = f.id
          map.setFeatureState({ source: 'parades', id: f.id }, { hovered: true })
        }
        const p = f.properties
        setTooltip({ x: e.point.x, y: e.point.y, name: p.name, city: p.city, country: p.country, date: p.date, daysUntil: p.daysUntil, color: p.color })
      })

      map.on('mouseleave', 'parades-circles', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredId.current !== null) {
          map.setFeatureState({ source: 'parades', id: hoveredId.current }, { hovered: false })
          hoveredId.current = null
        }
        setTooltip(null)
      })

      map.on('click', 'parades-circles', (e) => {
        const f = e.features[0]; if (!f) return
        const p = f.properties
        onSelect({ id: p.id, name: p.name, city: p.city, country: p.country, date: p.date, size: p.size, daysUntil: p.daysUntil, color: p.color, queerIndex: p.queerIndex, website: p.website, firstYear: p.firstYear })
      })

      map.on('click', (e) => {
        const queryLayers = clusteringEnabled
          ? ['parades-circles', 'clusters-circle']
          : ['parades-circles']
        const hits = map.queryRenderedFeatures(e.point, { layers: queryLayers })
        if (!hits.length) onSelect(null)
      })
    })

    return () => map.remove()
  }, [])

  // ── Sync parade data ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getSource('parades')) return
    map.getSource('parades').setData(paradesToGeoJSON(parades))
  }, [parades])

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
