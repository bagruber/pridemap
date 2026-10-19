import { describe, it, expect } from 'vitest'
import { nameKey, matchEntry, classify, isSideEvent, previousEdition } from './match.mjs'

const pride = (id, city, extra = {}) => ({
  id, city, name: `CSD ${city}`, country: 'DE', aka: [], editions: [{ year: 2026, date: '2026-07-25', status: 'unverified' }], ...extra,
})

const BERLIN = pride('de-berlin', 'Berlin')
const KOELN = pride('de-koeln', 'Köln', { cityNames: { en: 'Cologne' } })
const SCHWEDT = pride('de-schwedt-oder', 'Schwedt/Oder')
const STIVES = pride('gb-st-ives', 'St Ives', { country: 'GB', name: 'St Ives Pride' })
const FRANKFURT_M = pride('de-frankfurt-am-main', 'Frankfurt am Main')
const FRANKFURT_O = pride('de-frankfurt-oder', 'Frankfurt (Oder)')
const ALL = [BERLIN, KOELN, SCHWEDT, STIVES, FRANKFURT_M, FRANKFURT_O]

describe('nameKey', () => {
  it('drops years and Pride vocabulary', () => {
    expect(nameKey('CSD Templin 2027')).toBe('templin')
    expect(nameKey('Riga Pride 2027 / CSD Riga 2027')).toBe('riga riga')
    expect(nameKey('Christopher Street Day Berlin')).toBe('berlin')
  })

  it('unglues "ColognePride" and transliterates like the slugs', () => {
    expect(nameKey('ColognePride 2027')).toBe('cologne')
    expect(nameKey('Kraków')).toBe(nameKey('Krakow'))
  })

  it('removes whole words only', () => {
    expect(nameKey('Paradeplatz Pride')).toBe('paradeplatz')
  })
})

describe('matchEntry', () => {
  it('finds a Pride by name', () => {
    const m = matchEntry({ name: 'CSD Berlin 2027', place: 'Berlin', country: 'DE' }, ALL)
    expect(m).toMatchObject({ how: 'genau', pride: BERLIN })
  })

  it('uses the English city name and the slash variants', () => {
    const m = matchEntry({ name: 'CSD Köln 2027 / ColognePride 2027', country: 'DE' }, ALL)
    expect(m.pride).toBe(KOELN)
  })

  it('keeps punctuation in town names from getting in the way', () => {
    expect(matchEntry({ name: 'CSD Schwedt/Oder 2027', place: 'Schwedt/Oder', country: 'DE' }, ALL).pride).toBe(SCHWEDT)
  })

  it('matches loosely when every word of the town appears', () => {
    const m = matchEntry({ name: 'St Ives & Hayle Pride 2026', country: 'GB' }, ALL)
    expect(m).toMatchObject({ how: 'unscharf', pride: STIVES })
  })

  it('refuses to guess between two towns of the same name', () => {
    const m = matchEntry({ name: 'CSD Frankfurt 2027', place: 'Frankfurt', country: 'DE' }, ALL)
    expect(m.how).toBe('mehrdeutig')
    expect(m.candidates.map(p => p.id).sort()).toEqual(['de-frankfurt-am-main', 'de-frankfurt-oder'])
  })

  it('treats a match through an alias alone as loose', () => {
    const manchester = pride('gb-manchester', 'Manchester', { country: 'GB', name: 'Manchester Pride' })
    const m = matchEntry({ name: 'Sparkle Weekend 2026 / Manchester' }, [manchester])
    expect(m).toMatchObject({ how: 'unscharf', pride: manchester })
  })

  it('reports nothing for an unknown town', () => {
    expect(matchEntry({ name: 'CSD Templin 2027', place: 'Templin', country: 'DE' }, ALL).how).toBe('keiner')
  })
})

describe('classify', () => {
  const m = p => ({ pride: p, how: 'genau', candidates: [p] })

  it('sorts entries by what they mean for our data', () => {
    expect(classify({ date: '2027-07-24' }, m(BERLIN))).toBe('termin')
    expect(classify({ date: '2026-07-25' }, m(BERLIN))).toBe('bekannt')
    expect(classify({ date: '2026-08-01' }, m(BERLIN))).toBe('abweichung')
    expect(classify({ date: null }, m(BERLIN))).toBe('ohne-datum')
    expect(classify({ date: null, status: 'cancelled' }, m(BERLIN))).toBe('abgesagt')
    expect(classify({ date: '2027-03-13' }, { pride: null, how: 'keiner', candidates: [] })).toBe('neu')
    expect(classify({ date: '2027-03-13' }, { pride: null, how: 'mehrdeutig', candidates: [] })).toBe('mehrdeutig')
  })

  it('never compares dates on a loose match', () => {
    expect(classify({ name: 'Didsbury Pride Manchester', date: '2026-09-05' }, { pride: BERLIN, how: 'unscharf', candidates: [BERLIN] }))
      .toBe('unscharf')
  })

  it('keeps side events apart from the town they happen in', () => {
    const entry = { name: 'Trans Pride Bristol 2026', date: '2026-03-28' }
    expect(classify(entry, matchEntry(entry, [pride('gb-bristol', 'Bristol', { country: 'GB' })]))).toBe('neben')
  })

  it('offers last year as the plausibility check', () => {
    expect(previousEdition(BERLIN, 2027).date).toBe('2026-07-25')
    expect(previousEdition(BERLIN, 2026)).toBe(null)
  })
})

describe('isSideEvent', () => {
  it('flags what E9 leaves off the map', () => {
    expect(isSideEvent('Trans Pride Bristol 2026')).toBe(true)
    expect(isSideEvent('Pride Picnic Leeds')).toBe(true)
    expect(isSideEvent('Bristol Pride 2026')).toBe(false)
    expect(isSideEvent('Sparkle Weekend 2026 / Manchester')).toBe(true)
  })

  it('judges by the main name, not by an alias', () => {
    expect(isSideEvent('Salford Pride 2026 / Pink Picnic Salford Pride 2026')).toBe(false)
  })
})
