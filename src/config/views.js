export const VIEWS = {
  europe: {
    label: 'Europe',
    center: [15, 52],
    zoom: 4,
    bounds: [[-35, 24], [55, 73]],
    defaultSizes: [],
  },
  dach: {
    label: 'DACH',
    center: [11, 50.5],
    zoom: 5.8,
    bounds: [[4.0, 45.5], [18.5, 56.0]],
    defaultSizes: [],
  },
}

export const VALID_TIMEFRAMES = ['upcoming', 'past', 'all', 'weekend', 'next-weekend']
export const VALID_SIZES = ['small', 'medium', 'large']
export const VALID_VIEWS = Object.keys(VIEWS)
