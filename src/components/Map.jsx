import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Tooltip from './Tooltip.jsx'
import { colorForDays } from '../utils/timeColors.js'
import { VIEWS } from '../App.jsx'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const ORS_KEY = import.meta.env.VITE_ORS_API_KEY

const SIZE_RADIUS       = { small: 4, medium: 7, large: 11 }
const SIZE_RADIUS_HOVER = { small: 6, medium: 10, large: 14 }

// Isochrone time bands in seconds, outer→inner
const ISO_BANDS = [
  { seconds: 7200, color: 'rgba(10,132,255,0.12)',  stroke: 'rgba(10,132,255,0.5)' },
  { seconds: 5400, color: 'rgba(52,199,89,0.12)',   stroke: 'rgba(52,199,89,0.5)' },
  { seconds: 3600, color: 'rgba(255,149,0,0.12)',   stroke: 'rgba(255,149,0,0.5)' },
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

async function fetchIsochrones(lon, lat, profile) {
  if (!ORS_KEY) {
    console.warn('No ORS API key set (VITE_ORS_API_KEY). Isochrones disabled.')
    return null
  }
  const res = await fetch(
    `https://api.openrouteservice.org/v2/isochrones/${profile}`,
    {
      method: 'POST',
      headers: {
        'Authorization': ORS_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/geo+json',
      },
      body: JSON.stringify({
        locations: [[lon, lat]],
        range: [1800, 3600, 5400, 7200],
        range_type: 'time',
        smoothing: 0.9,
      }),
    }
  )
  if (!res.ok) throw new Error(`ORS ${res.status}: ${await res.text()}`)
  return res.json()
}

export default function Map({
  parades, onSelect, view,
  isoOrigin, onIsoOriginSet,
  isoMode, isoPinning, onPinningDone,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const hoveredId = useRef(null)
  const [isoLoading, setIsoLoading] = useState(false)
  const [isoError, setIsoError] = useState(null)

  // ── Initialize map ──────────────────────────────────────────────────────────
  useEffect(() => {
    const { center, zoom, bounds } = VIEWS[view] ?? VIEWS.europe
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center,
      zoom,
      minZoom: 3,
      maxZoom: 12,
      maxBounds: [[-35, 24], [55, 73]],
      attributionControl: { compact: true },
    })
    mapRef.current = map

    map.on('load', () => {
      // ── Parade source + layer ─────────────────────────────────────────────
      map.addSource('parades', {
        type: 'geojson',
        data: paradesToGeoJSON(parades),
        generateId: false,
      })
      map.addLayer({
        id: 'parades-circles',
        type: 'circle',
        source: 'parades',
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

      // ── Isochrone sources + layers ────────────────────────────────────────
      map.addSource('isochrones', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'iso-fill',
        type: 'fill',
        source: 'isochrones',
        paint: {
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': 1,
        },
      }, 'parades-circles')
      map.addLayer({
        id: 'iso-line',
        type: 'line',
        source: 'isochrones',
        paint: {
          'line-color': ['get', 'strokeColor'],
          'line-width': 1.5,
          'line-opacity': 0.9,
        },
      }, 'parades-circles')

      // ── Origin pin source + layer ─────────────────────────────────────────
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
        paint: {
          'circle-radius': 4,
          'circle-color': '#ffffff',
        },
      })

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
        const features = map.queryRenderedFeatures(e.point, { layers: ['parades-circles'] })
        if (!features.length) onSelect(null)
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

    // Update origin pin immediately
    if (map.getSource('origin')) {
      map.getSource('origin').setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] } }],
      })
    }

    if (!ORS_KEY) {
      setIsoError('Set VITE_ORS_API_KEY in .env to enable isochrones')
      return
    }

    setIsoLoading(true)
    setIsoError(null)

    fetchIsochrones(lon, lat, isoMode)
      .then(geojson => {
        if (!map.getSource('isochrones')) return

        // Annotate each feature with colours keyed by the `value` (seconds)
        const bandBySeconds = Object.fromEntries(ISO_BANDS.map(b => [b.seconds, b]))
        const annotated = {
          ...geojson,
          features: geojson.features.map(f => {
            const band = bandBySeconds[f.properties.value] ?? ISO_BANDS[0]
            return { ...f, properties: { ...f.properties, fillColor: band.color, strokeColor: band.stroke } }
          }),
        }
        map.getSource('isochrones').setData(annotated)
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
