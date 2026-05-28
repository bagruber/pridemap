import { VIEWS, VALID_TIMEFRAMES, VALID_SIZES, VALID_VIEWS } from '../config/views.js'

export function readHash() {
  try {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const view = VALID_VIEWS.includes(params.get('view')) ? params.get('view') : 'europe'
    return {
      view,
      timeframe: VALID_TIMEFRAMES.includes(params.get('timeframe')) ? params.get('timeframe') : 'upcoming',
      sizes: params.has('sizes')
        ? params.get('sizes').split(',').filter(s => VALID_SIZES.includes(s))
        : null,
      countries: params.has('countries')
        ? params.get('countries').split(',').filter(c => c.length >= 2)
        : [],
      selectedId: params.has('selected') ? Number(params.get('selected')) : null,
      viewMode: params.get('mode') === 'list' ? 'list' : 'map',
    }
  } catch { return null }
}

export function writeHash({ view, filters, selectedParade, viewMode }) {
  const params = new URLSearchParams()
  if (view !== 'europe') params.set('view', view)
  if (filters.timeframe !== 'upcoming') params.set('timeframe', filters.timeframe)
  const def = VIEWS[view].defaultSizes
  if (filters.sizes.length !== def.length || filters.sizes.some(s => !def.includes(s)))
    params.set('sizes', filters.sizes.join(','))
  if (filters.countries.length) params.set('countries', filters.countries.join(','))
  if (selectedParade) params.set('selected', selectedParade.id)
  if (viewMode !== 'map') params.set('mode', viewMode)
  const qs = params.toString()
  history.replaceState(null, '', qs ? `#${qs}` : location.pathname + location.search)
}
