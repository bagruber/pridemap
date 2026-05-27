import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Tooltip from './Tooltip.jsx'
import { colorForDays } from '../utils/timeColors.js'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const SIZE_RADIUS = { small: 4, medium: 7, large: 11 }
const SIZE_RADIUS_HOVER = { small: 6, medium: 10, large: 14 }

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

export default function Map({ parades, onSelect }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const hoveredId = useRef(null)

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [15, 52],
      zoom: 4,
      minZoom: 3,
      maxZoom: 12,
      maxBounds: [[-35, 24], [55, 73]],
      attributionControl: { compact: true },
    })

    mapRef.current = map

    map.on('load', () => {
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
          'circle-opacity': [
            'case',
            ['boolean', ['feature-state', 'dimmed'], false],
            0.25,
            1,
          ],
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            2,
            0.5,
          ],
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#ffffff',
            'rgba(255,255,255,0.15)',
          ],
          'circle-pitch-alignment': 'map',
        },
      })

      map.on('mouseenter', 'parades-circles', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const feat = e.features[0]
        if (!feat) return

        if (hoveredId.current !== null) {
          map.setFeatureState({ source: 'parades', id: hoveredId.current }, { hovered: false })
        }
        hoveredId.current = feat.id
        map.setFeatureState({ source: 'parades', id: feat.id }, { hovered: true })

        const p = feat.properties
        setTooltip({
          x: e.point.x,
          y: e.point.y,
          name: p.name,
          city: p.city,
          country: p.country,
          date: p.date,
          daysUntil: p.daysUntil,
          color: p.color,
        })
      })

      map.on('mousemove', 'parades-circles', (e) => {
        const feat = e.features[0]
        if (!feat) return
        if (hoveredId.current !== feat.id) {
          if (hoveredId.current !== null) {
            map.setFeatureState({ source: 'parades', id: hoveredId.current }, { hovered: false })
          }
          hoveredId.current = feat.id
          map.setFeatureState({ source: 'parades', id: feat.id }, { hovered: true })
        }
        const p = feat.properties
        setTooltip({
          x: e.point.x,
          y: e.point.y,
          name: p.name,
          city: p.city,
          country: p.country,
          date: p.date,
          daysUntil: p.daysUntil,
          color: p.color,
        })
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
        const feat = e.features[0]
        if (!feat) return
        const p = feat.properties
        onSelect({
          id: p.id,
          name: p.name,
          city: p.city,
          country: p.country,
          date: p.date,
          size: p.size,
          daysUntil: p.daysUntil,
          color: p.color,
          queerIndex: p.queerIndex,
          website: p.website,
          firstYear: p.firstYear,
        })
      })

      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['parades-circles'] })
        if (!features.length) onSelect(null)
      })
    })

    return () => map.remove()
  }, [])

  // Update source when parades change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getSource('parades')) return
    map.getSource('parades').setData(paradesToGeoJSON(parades))
  }, [parades])

  return (
    <>
      <div ref={containerRef} className="map-container" />
      {tooltip && <Tooltip {...tooltip} />}
    </>
  )
}
