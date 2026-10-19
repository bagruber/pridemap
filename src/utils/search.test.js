import { describe, it, expect } from 'vitest'
import { searchParades } from './search.js'

const P = (id, city, country, extra = {}) => ({
  id, city, country, name: `${city} Pride`, region: null, daysUntil: 30, ...extra,
})

const PARADES = [
  P('berlin', 'Berlin', 'DE', { name: 'CSD Berlin', daysUntil: 40 }),
  P('bernburg', 'Bernburg', 'DE', { name: 'CSD Bernburg', daysUntil: 10 }),
  P('madrid', 'Madrid', 'ES', { name: 'Orgullo Madrid' }),
  P('barcelona', 'Barcelona', 'ES', { name: 'Pride Barcelona' }),
  P('paris', 'Paris', 'FR', { name: 'Marche des Fiertés Paris' }),
  P('koeln', 'Köln', 'DE', { name: 'ColognePride', region: 'Nordrhein-Westfalen' }),
  P('wuerzburg', 'Würzburg', 'DE', { name: 'CSD Würzburg', region: 'Bayern' }),
]

const ids = list => list.map(p => p.id)

describe('pride vocabulary', () => {
  // The word for "Pride" changes at every border. Whichever one someone types
  // must not cost them the hit.
  it('"pride berlin", "csd berlin" and "berlin" find the same row', () => {
    const plain = ids(searchParades(PARADES, 'berlin'))
    expect(ids(searchParades(PARADES, 'pride berlin'))).toEqual(plain)
    expect(ids(searchParades(PARADES, 'csd berlin'))).toEqual(plain)
    expect(plain[0]).toBe('berlin')
  })

  it('word order does not matter', () => {
    expect(ids(searchParades(PARADES, 'berlin csd'))).toEqual(ids(searchParades(PARADES, 'csd berlin')))
  })

  it('a bare local term narrows to its country', () => {
    expect(ids(searchParades(PARADES, 'orgullo')).sort()).toEqual(['barcelona', 'madrid'])
  })

  it('a bare universal term narrows to nothing', () => {
    expect(searchParades(PARADES, 'pride')).toHaveLength(PARADES.length)
  })

  it('a local term plus a city does not restrict the country', () => {
    // A German speaker types "csd paris" — and means Paris.
    expect(ids(searchParades(PARADES, 'csd paris'))).toEqual(['paris'])
  })
})

describe('ranking', () => {
  it('city prefix beats city substring', () => {
    // "bern" is a prefix of Bernburg and sits inside Berlin's name only
    expect(ids(searchParades(PARADES, 'bern'))).toEqual(['bernburg'])
  })

  it('within a tier the soonest date comes first', () => {
    const got = ids(searchParades(PARADES, 'csd'))
    expect(got.indexOf('bernburg')).toBeLessThan(got.indexOf('berlin'))
  })

  it('past events sink below upcoming ones', () => {
    const withPast = PARADES.map(p => p.id === 'bernburg' ? { ...p, daysUntil: -5 } : p)
    const got = ids(searchParades(withPast, 'csd'))
    expect(got.indexOf('berlin')).toBeLessThan(got.indexOf('bernburg'))
  })

  it('region and country name match last', () => {
    expect(ids(searchParades(PARADES, 'bayern'))).toEqual(['wuerzburg'])
    expect(ids(searchParades(PARADES, 'spain')).sort()).toEqual(['barcelona', 'madrid'])
  })
})

describe('normalisation', () => {
  it('ignores case and diacritics', () => {
    expect(ids(searchParades(PARADES, 'wurzburg'))).toEqual(['wuerzburg'])
    expect(ids(searchParades(PARADES, 'KÖLN'))).toEqual(['koeln'])
  })

  it('finds a city under its English and German name', () => {
    expect(ids(searchParades(PARADES, 'cologne'))).toEqual(['koeln'])
  })

  it('an empty query matches everything, untouched', () => {
    expect(ids(searchParades(PARADES, ''))).toEqual(ids(PARADES))
    expect(ids(searchParades(PARADES, '   '))).toEqual(ids(PARADES))
  })

  it('nothing matching gives nothing back', () => {
    expect(searchParades(PARADES, 'reykjavik')).toEqual([])
  })
})
