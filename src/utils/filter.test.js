import { describe, it, expect } from 'vitest'
import { filterParades } from './filter.js'
import { daysUntil } from './days.js'

const DEFAULTS = { countries: [], sizes: [], months: [], timeframe: 'all' }

// Dates around the weekend of Sat 13 / Sun 14 June 2026
const DATES = {
  fri: '2026-06-12',
  sat: '2026-06-13',
  sun: '2026-06-14',
  mon: '2026-06-15',
  nextSat: '2026-06-20',
  nextSun: '2026-06-21',
  july: '2026-07-25',
}

const day = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }

function fixture(today) {
  return Object.entries(DATES).map(([key, date]) => ({
    id: key, city: key, country: 'DE', size: 'medium', date,
    daysUntil: daysUntil(date, today),
  }))
}

const ids = list => list.map(p => p.id).sort()

describe('weekend filter', () => {
  // "This weekend" has to mean the same two days whether you ask on Friday,
  // on the Saturday itself, or on the Sunday evening.
  for (const [name, iso] of [['Friday', DATES.fri], ['Saturday', DATES.sat], ['Sunday', DATES.sun]]) {
    it(`finds Sat and Sun when asked on ${name}`, () => {
      const today = day(iso)
      const got = filterParades(fixture(today), { ...DEFAULTS, timeframe: 'weekend' }, today)
      expect(ids(got)).toEqual(['sat', 'sun'])
    })
  }

  it('rolls on to the coming weekend when asked on Monday', () => {
    const today = day(DATES.mon)
    const got = filterParades(fixture(today), { ...DEFAULTS, timeframe: 'weekend' }, today)
    expect(ids(got)).toEqual(['nextSat', 'nextSun'])
  })

  // Europe/Berlin falls back on Sunday 25 October 2026. Counting the weekend
  // in whole days of milliseconds pushed "next weekend" an hour back over that
  // night and dropped Sunday 1 November out of its own weekend.
  it('next weekend survives the clock change', () => {
    const today = day('2026-10-24')
    const around = ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'].map(date => ({
      id: date, city: date, country: 'DE', size: 'medium', date,
      daysUntil: daysUntil(date, today),
    }))
    const got = filterParades(around, { ...DEFAULTS, timeframe: 'next-weekend' }, today)
    expect(ids(got)).toEqual(['2026-10-31', '2026-11-01'])
  })

  it('next weekend is the one after this one', () => {
    const today = day(DATES.fri)
    const got = filterParades(fixture(today), { ...DEFAULTS, timeframe: 'next-weekend' }, today)
    expect(ids(got)).toEqual(['nextSat', 'nextSun'])
  })
})

describe('timeframe', () => {
  const today = day(DATES.sun)

  it('upcoming keeps today and later', () => {
    const got = filterParades(fixture(today), { ...DEFAULTS, timeframe: 'upcoming' }, today)
    expect(ids(got)).toEqual(['july', 'mon', 'nextSat', 'nextSun', 'sun'])
  })

  it('past keeps only what is over', () => {
    const got = filterParades(fixture(today), { ...DEFAULTS, timeframe: 'past' }, today)
    expect(ids(got)).toEqual(['fri', 'sat'])
  })
})

describe('month, size and country', () => {
  const today = day(DATES.fri)

  it('month filter goes by the date, not by daysUntil', () => {
    const got = filterParades(fixture(today), { ...DEFAULTS, months: [7] }, today)
    expect(ids(got)).toEqual(['july'])
  })

  it('several months are an OR', () => {
    const got = filterParades(fixture(today), { ...DEFAULTS, months: [6, 7] }, today)
    expect(got).toHaveLength(7)
  })

  it('an empty size list means every size', () => {
    const mixed = fixture(today).map((p, i) => ({ ...p, size: i === 0 ? 'large' : 'small' }))
    expect(filterParades(mixed, DEFAULTS, today)).toHaveLength(7)
    expect(filterParades(mixed, { ...DEFAULTS, sizes: ['large'] }, today)).toHaveLength(1)
  })

  it('country filter', () => {
    const mixed = fixture(today).map((p, i) => ({ ...p, country: i === 0 ? 'ES' : 'DE' }))
    expect(filterParades(mixed, { ...DEFAULTS, countries: ['ES'] }, today)).toHaveLength(1)
  })
})

describe('daysUntil', () => {
  // Europe/Berlin changes clocks on 29 March and 25 October 2026. Counting in
  // whole milliseconds would be off by one day across those nights.
  it('survives the spring change', () => {
    expect(daysUntil('2026-03-30', day('2026-03-28'))).toBe(2)
    expect(daysUntil('2026-03-29', day('2026-03-28'))).toBe(1)
  })

  it('survives the autumn change', () => {
    expect(daysUntil('2026-10-26', day('2026-10-24'))).toBe(2)
    expect(daysUntil('2026-10-25', day('2026-10-24'))).toBe(1)
  })

  it('is negative for past dates and zero for today', () => {
    expect(daysUntil('2026-06-13', day('2026-06-13'))).toBe(0)
    expect(daysUntil('2026-06-12', day('2026-06-13'))).toBe(-1)
  })
})

describe('open dates', () => {
  const today = day(DATES.fri)
  const open = { id: 'open', city: 'Open', country: 'DE', size: 'medium', date: null, daysUntil: null }

  it('count as upcoming', () => {
    const got = filterParades([...fixture(today), open], { ...DEFAULTS, timeframe: 'upcoming' }, today)
    expect(ids(got)).toContain('open')
  })

  it('are not past', () => {
    const got = filterParades([...fixture(today), open], { ...DEFAULTS, timeframe: 'past' }, today)
    expect(ids(got)).not.toContain('open')
  })

  it('belong to no month and to no weekend', () => {
    for (const f of [{ months: [6] }, { timeframe: 'weekend' }, { timeframe: 'next-weekend' }]) {
      expect(ids(filterParades([open], { ...DEFAULTS, ...f }, today))).toEqual([])
    }
  })

  it('still answer to country and size', () => {
    expect(filterParades([open], { ...DEFAULTS, countries: ['DE'] }, today)).toHaveLength(1)
    expect(filterParades([open], { ...DEFAULTS, sizes: ['large'] }, today)).toHaveLength(0)
  })
})
