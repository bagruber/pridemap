import { describe, it, expect } from 'vitest'
import { pickEdition, currentEdition, editionsFor } from './edition.js'

const day = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }

const pride = (...editions) => ({
  id: 'de-berlin', name: 'CSD Berlin', city: 'Berlin', country: 'DE',
  lat: 52.52, lon: 13.405, size: 'large', editions,
})

const E = (year, date) => ({ year, date, status: 'confirmed' })

describe('pickEdition', () => {
  const p = pride(E(2026, '2026-07-25'), E(2027, '2027-07-24'))

  it('takes the next date in the season', () => {
    expect(pickEdition(p, day('2026-06-10')).year).toBe(2026)
  })

  it('moves on to next year once this year is over', () => {
    expect(pickEdition(p, day('2026-10-19')).year).toBe(2027)
  })

  it('counts the day itself as upcoming', () => {
    expect(pickEdition(p, day('2026-07-25')).year).toBe(2026)
  })

  it('is open when last season ran but this one has no date yet', () => {
    const got = pickEdition(pride(E(2026, '2026-07-25')), day('2026-10-19'))
    expect(got).toMatchObject({ year: 2027, date: null, status: 'open', lastDate: '2026-07-25' })
  })

  it('falls back to the last edition once the series has lapsed', () => {
    // Season on 19.10.2026 is 2027; a Pride last held in 2024 is not "open",
    // it is over.
    const got = pickEdition(pride(E(2024, '2024-07-27')), day('2026-10-19'))
    expect(got).toMatchObject({ year: 2024, date: '2024-07-27' })
  })

  it('ignores editions without a date when a dated one is ahead', () => {
    const open = pride({ year: 2027, date: null, status: 'announced' }, E(2026, '2026-12-05'))
    expect(pickEdition(open, day('2026-10-19')).date).toBe('2026-12-05')
  })

  it('is null for a Pride with no dated edition at all', () => {
    expect(pickEdition(pride({ year: 2027, date: null, status: 'announced' }), day('2026-10-19'))).toBe(null)
  })
})

describe('currentEdition', () => {
  it('folds the edition into the Pride', () => {
    const got = currentEdition(pride(E(2026, '2026-07-25')), day('2026-06-10'))
    expect(got.id).toBe('de-berlin')
    expect(got.date).toBe('2026-07-25')
    expect(got.daysUntil).toBe(45)
  })

  it('counts days backwards for a past edition', () => {
    const got = currentEdition(pride(E(2026, '2026-07-25')), day('2026-07-26'))
    expect(got.daysUntil).toBe(-1)
    expect(got.open).toBe(false)
  })

  it('leaves an open edition without a countdown', () => {
    const got = currentEdition(pride(E(2026, '2026-07-25')), day('2026-10-19'))
    expect(got.open).toBe(true)
    expect(got.daysUntil).toBe(null)
    expect(got.lastDate).toBe('2026-07-25')
  })
})

describe('editionsFor', () => {
  it('drops Prides that have no date to show', () => {
    const list = [pride(E(2026, '2026-07-25')), { ...pride(), id: 'de-x', editions: [] }]
    expect(editionsFor(list, day('2026-06-10')).map(p => p.id)).toEqual(['de-berlin'])
  })
})
